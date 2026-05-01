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

async function fetchContractLines(contractGid: string): Promise<any[]> {
  try {
    const res = await fetch(`https://${SHOP}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": SHOPIFY_TOKEN },
      body: JSON.stringify({
        query: `query($id:ID!){subscriptionContract(id:$id){lines(first:20){edges{node{title quantity currentPrice{amount currencyCode} variantImage{url}}}}}}`,
        variables: { id: contractGid },
      }),
    });
    const data = await res.json();
    return (data?.data?.subscriptionContract?.lines?.edges || []).map((l: any) => ({
      title: l.node.title,
      quantity: l.node.quantity,
      price: l.node.currentPrice?.amount,
      currency: l.node.currentPrice?.currencyCode,
      image: l.node.variantImage?.url,
    }));
  } catch { return []; }
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
    const res = await fetch(
      `https://${SHOP}/admin/api/2024-01/subscription_contracts.json?customer_id=${numericId}&limit=50`,
      { headers: { "X-Shopify-Access-Token": SHOPIFY_TOKEN, "Content-Type": "application/json" } }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("[contracts] REST error:", res.status, text);
      return Response.json({ contracts: [], error: `Shopify ${res.status}` }, { headers: corsHeaders(request) });
    }

    const data = await res.json();
    console.log("[contracts] REST count:", data?.subscription_contracts?.length);

    const contracts = await Promise.all(
      (data?.subscription_contracts || []).map(async (c: any) => {
        const gid = `gid://shopify/SubscriptionContract/${c.id}`;
        const lines = await fetchContractLines(gid);
        return {
          id: String(c.id),
          gid,
          status: c.status,
          nextBillingDate: c.next_billing_date,
          interval: c.billing_policy?.interval,
          intervalCount: c.billing_policy?.interval_count,
          lines,
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

    const gid = `gid://shopify/SubscriptionContract/${contract_id}`;
    const mutationNames: Record<string, string> = {
      pause: "subscriptionContractPause",
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
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": SHOPIFY_TOKEN },
      body: JSON.stringify({ query: mutations[contractAction] }),
    });

    const data = await res.json();
    const result = data?.data?.[mutationNames[contractAction]];
    const errors = result?.userErrors || [];

    if (errors.length > 0) {
      return Response.json({ error: errors[0].message }, { status: 400, headers: corsHeaders(request) });
    }

    return Response.json({ success: true, status: result?.contract?.status }, { headers: corsHeaders(request) });

  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
