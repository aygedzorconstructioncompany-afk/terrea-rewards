import prisma from "../db.server";

const corsHeaders = (request: any) => {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
};

const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const SHOP = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

// Fetch recent subscription orders for customer to get product lines
async function fetchCustomerOrderLines(customerId: string): Promise<any[]> {
  try {
    const res = await fetch(`https://${SHOP}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
      },
      body: JSON.stringify({
        query: `
          query($customerId: ID!) {
            customer(id: $customerId) {
              orders(first: 5, sortKey: CREATED_AT, reverse: true) {
                edges {
                  node {
                    lineItems(first: 20) {
                      edges {
                        node {
                          title
                          quantity
                          variant {
                            price
                            image { url }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          customerId: `gid://shopify/Customer/${customerId}`,
        },
      }),
    });
    const data = await res.json();
    const orders = data?.data?.customer?.orders?.edges || [];
    if (!orders.length) return [];

    // Take line items from the most recent order
    const latestOrder = orders[0].node;
    return (latestOrder.lineItems?.edges || []).map((l: any) => ({
      title: l.node.title,
      quantity: l.node.quantity,
      price: l.node.variant?.price,
      currency: "GBP",
      image: l.node.variant?.image?.url,
    }));
  } catch (e: any) {
    console.error("[contracts] Order lines error:", e.message);
    return [];
  }
}

export async function loader({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");

  if (!customerId) {
    return Response.json({ error: "Missing customer_id" }, { status: 400, headers: corsHeaders(request) });
  }

  try {
    const numericId = String(customerId).replace("gid://shopify/Customer/", "");

    // Read from our DB — no extra scope needed
    const subs = await prisma.subscription.findMany({
      where: { customerId: numericId },
    });

    console.log(`[contracts] Found ${subs.length} subs in DB for customer ${numericId}`);

    if (!subs.length) {
      return Response.json({ contracts: [] }, { headers: corsHeaders(request) });
    }

    // Get product lines from recent orders (uses read_orders scope we already have)
    const lines = await fetchCustomerOrderLines(numericId);
    console.log(`[contracts] Got ${lines.length} line items from orders`);

    const contracts = subs.map((s: any) => {
      const contractNumericId = s.subscriptionContractId
        ? s.subscriptionContractId.replace("gid://shopify/SubscriptionContract/", "")
        : "unknown";

      return {
        id: contractNumericId,
        gid: s.subscriptionContractId || "",
        status: (s.status || "active").toUpperCase(),
        nextBillingDate: s.lastOrderAt
          ? new Date(new Date(s.lastOrderAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        interval: "MONTH",
        intervalCount: 1,
        monthsActive: s.monthsActive,
        lines,
      };
    });

    return Response.json({ contracts }, { headers: corsHeaders(request) });

  } catch (e: any) {
    console.error("[contracts] Error:", e.message);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const { contract_id, action: contractAction } = await request.json();
    if (!contract_id || !contractAction) {
      return Response.json({ error: "Missing data" }, { status: 400, headers: corsHeaders(request) });
    }

    const gid = contract_id.startsWith("gid://")
      ? contract_id
      : `gid://shopify/SubscriptionContract/${contract_id}`;

    const mutationNames: Record<string, string> = {
      pause:  "subscriptionContractPause",
      cancel: "subscriptionContractCancel",
      resume: "subscriptionContractActivate",
    };

    const mutations: Record<string, string> = {
      pause:  `mutation{subscriptionContractPause(subscriptionContractId:"${gid}"){contract{id status}userErrors{field message}}}`,
      cancel: `mutation{subscriptionContractCancel(subscriptionContractId:"${gid}"){contract{id status}userErrors{field message}}}`,
      resume: `mutation{subscriptionContractActivate(subscriptionContractId:"${gid}"){contract{id status}userErrors{field message}}}`,
    };

    if (!mutations[contractAction]) {
      return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders(request) });
    }

    const res = await fetch(`https://${SHOP}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query: mutations[contractAction] }),
    });

    const data = await res.json();
    console.log(`[contracts/${contractAction}]`, JSON.stringify(data));

    const result = data?.data?.[mutationNames[contractAction]];
    const errors = result?.userErrors || [];

    if (errors.length > 0) {
      return Response.json({ error: errors[0].message }, { status: 400, headers: corsHeaders(request) });
    }

    // Update status in our DB too
    const dbStatus = contractAction === "pause" ? "paused"
                   : contractAction === "cancel" ? "cancelled"
                   : "active";
    try {
      await prisma.subscription.updateMany({
        where: { subscriptionContractId: gid },
        data: { status: dbStatus },
      });
    } catch {}

    return Response.json({ success: true, status: result?.contract?.status }, { headers: corsHeaders(request) });

  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
