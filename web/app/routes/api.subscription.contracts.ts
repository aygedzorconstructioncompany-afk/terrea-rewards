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

async function fetchContractDetails(contractGid: string): Promise<any> {
  try {
    const res = await fetch(`https://${SHOP}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
      },
      body: JSON.stringify({
        query: `
          query($id: ID!) {
            subscriptionContract(id: $id) {
              id
              status
              nextBillingDate
              billingPolicy { interval intervalCount }
              lines(first: 20) {
                edges {
                  node {
                    title
                    quantity
                    currentPrice { amount currencyCode }
                    variantImage { url }
                  }
                }
              }
            }
          }
        `,
        variables: { id: contractGid },
      }),
    });
    const data = await res.json();
    const c = data?.data?.subscriptionContract;
    if (!c) return null;
    return {
      id: c.id.replace("gid://shopify/SubscriptionContract/", ""),
      gid: c.id,
      status: c.status,
      nextBillingDate: c.nextBillingDate,
      interval: c.billingPolicy?.interval,
      intervalCount: c.billingPolicy?.intervalCount,
      lines: (c.lines?.edges || []).map((l: any) => ({
        title: l.node.title,
        quantity: l.node.quantity,
        price: l.node.currentPrice?.amount,
        currency: l.node.currentPrice?.currencyCode,
        image: l.node.variantImage?.url,
      })),
    };
  } catch (e: any) {
    console.error("[contracts] GraphQL error:", e.message);
    return null;
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
    const shop = SHOP;
    const numericId = String(customerId).replace("gid://shopify/Customer/", "");

    // Read subscription contract IDs from our DB — no read_subscription_contracts scope needed
    const subs = await prisma.subscription.findMany({
      where: { customerId: numericId },
    });

    console.log(`[contracts] Found ${subs.length} subscriptions in DB for customer ${numericId}`);

    if (!subs.length) {
      return Response.json({ contracts: [] }, { headers: corsHeaders(request) });
    }

    // Fetch details from Shopify for each contract via GraphQL (works with existing scopes)
    const contracts = await Promise.all(
      subs
        .filter((s: any) => s.subscriptionContractId)
        .map(async (s: any) => {
          const details = await fetchContractDetails(s.subscriptionContractId);
          if (details) return details;
          // Fallback to DB data if GraphQL fails
          return {
            id: s.subscriptionContractId.replace("gid://shopify/SubscriptionContract/", ""),
            gid: s.subscriptionContractId,
            status: s.status?.toUpperCase() || "ACTIVE",
            nextBillingDate: null,
            interval: "MONTH",
            intervalCount: 1,
            lines: [],
          };
        })
    );

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

    // Also update status in our DB
    const numericId = gid.replace("gid://shopify/SubscriptionContract/", "");
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
