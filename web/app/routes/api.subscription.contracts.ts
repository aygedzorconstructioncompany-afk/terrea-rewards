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
    const gid = `gid://shopify/Customer/${customerId}`;
    const API_URL = `https://${SHOP}/admin/api/2024-01/graphql.json`;

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
      },
      body: JSON.stringify({
        query: `
          query getContracts($customerId: ID!) {
            customer(id: $customerId) {
              subscriptionContracts(first: 20) {
                edges {
                  node {
                    id
                    status
                    nextBillingDate
                    lines(first: 10) {
                      edges {
                        node {
                          title
                          quantity
                          currentPrice {
                            amount
                            currencyCode
                          }
                          variantImage {
                            url
                          }
                        }
                      }
                    }
                    billingPolicy {
                      interval
                      intervalCount
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { customerId: gid },
      }),
    });

    const data = await res.json();
    console.log('[contracts] Shopify response:', JSON.stringify(data));

    const edges = data?.data?.customer?.subscriptionContracts?.edges || [];
    const contracts = edges.map((e: any) => {
      const node = e.node;
      const contractId = node.id.replace("gid://shopify/SubscriptionContract/", "");
      return {
        id: contractId,
        gid: node.id,
        status: node.status,
        nextBillingDate: node.nextBillingDate,
        interval: node.billingPolicy?.interval,
        intervalCount: node.billingPolicy?.intervalCount,
        lines: (node.lines?.edges || []).map((l: any) => ({
          title: l.node.title,
          quantity: l.node.quantity,
          price: l.node.currentPrice?.amount,
          currency: l.node.currentPrice?.currencyCode,
          image: l.node.variantImage?.url,
        })),
      };
    });

    return Response.json({ contracts }, { headers: corsHeaders(request) });

  } catch (e: any) {
    console.error('[contracts] Error:', e.message);
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

    const gid = `gid://shopify/SubscriptionContract/${contract_id}`;
    const API_URL = `https://${SHOP}/admin/api/2024-01/graphql.json`;

    const mutations: Record<string, string> = {
      pause:  `mutation { subscriptionContractPause(subscriptionContractId: "${gid}") { contract { id status } userErrors { field message } } }`,
      cancel: `mutation { subscriptionContractCancel(subscriptionContractId: "${gid}") { contract { id status } userErrors { field message } } }`,
      resume: `mutation { subscriptionContractActivate(subscriptionContractId: "${gid}") { contract { id status } userErrors { field message } } }`,
    };

    const query = mutations[contractAction];
    if (!query) {
      return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders(request) });
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    console.log(`[contracts/${contractAction}]`, JSON.stringify(data));

    const actionKey = `subscriptionContract${contractAction.charAt(0).toUpperCase() + contractAction.slice(1)}`;
    const result = data?.data?.[actionKey];
    const errors = result?.userErrors || [];

    if (errors.length > 0) {
      return Response.json({ error: errors[0].message }, { status: 400, headers: corsHeaders(request) });
    }

    return Response.json({ success: true, status: result?.contract?.status }, { headers: corsHeaders(request) });

  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
