// web/app/routes/api.subscription.manage-products.ts
// Endpoint: POST /api/subscription/manage-products
// Body: { action: "add"|"remove", email, variantId, quantity? }

const SHOP = process.env.SHOPIFY_SHOP!;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const API_VERSION = "2024-01";

async function gql(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  const json = await res.json();
  if (json.errors) console.error("GQL errors:", JSON.stringify(json.errors));
  return json;
}

async function getCustomerId(email: string) {
  const d = await gql(
    `query($q:String!){customers(first:1,query:$q){edges{node{id}}}}`,
    { q: `email:${email}` }
  );
  return d.data?.customers?.edges?.[0]?.node?.id ?? null;
}

async function getActiveContractId(customerId: string) {
  const d = await gql(
    `query($id:ID!){customer(id:$id){subscriptionContracts(first:10){edges{node{id status}}}}}`,
    { id: customerId }
  );
  const edges = d.data?.customer?.subscriptionContracts?.edges ?? [];
  const found = edges.find(
    (e: { node: { status: string } }) =>
      e.node.status === "ACTIVE" || e.node.status === "PAUSED"
  );
  return found?.node?.id ?? null;
}

async function createDraft(contractId: string) {
  const d = await gql(
    `mutation($id:ID!){subscriptionContractCreateRevision(contractId:$id){draft{id}userErrors{field message}}}`,
    { id: contractId }
  );
  const errs = d.data?.subscriptionContractCreateRevision?.userErrors;
  if (errs?.length) { console.error("Draft errors:", errs); return null; }
  return d.data?.subscriptionContractCreateRevision?.draft?.id ?? null;
}

async function commitDraft(draftId: string) {
  const d = await gql(
    `mutation($id:ID!){subscriptionDraftCommit(draftId:$id){contract{id}userErrors{field message}}}`,
    { id: draftId }
  );
  const errs = d.data?.subscriptionDraftCommit?.userErrors;
  if (errs?.length) { console.error("Commit errors:", errs); return false; }
  return !!d.data?.subscriptionDraftCommit?.contract?.id;
}

async function addProductToContract(
  contractId: string, variantId: string, quantity: number
) {
  const gid = variantId.startsWith("gid://")
    ? variantId
    : `gid://shopify/ProductVariant/${variantId}`;

  // Получить текущую цену варианта
  const priceData = await gql(
    `query($id:ID!){productVariant(id:$id){price}}`,
    { id: gid }
  );
  const price = priceData.data?.productVariant?.price ?? "0.00";

  const draftId = await createDraft(contractId);
  if (!draftId) return { success: false, error: "Could not create draft" };

  const d = await gql(
    `mutation($draftId:ID!,$input:SubscriptionLineInput!){
      subscriptionDraftLineAdd(draftId:$draftId,input:$input){
        draft{id} lineAdded{id} userErrors{field message}
      }
    }`,
    { draftId, input: { productVariantId: gid, quantity, currentPrice: price, recurringPrice: price } }
  );
  const errs = d.data?.subscriptionDraftLineAdd?.userErrors;
  if (errs?.length) {
    console.error("Add line errors:", errs);
    return { success: false, error: errs.map((e: {message:string}) => e.message).join(", ") };
  }

  const ok = await commitDraft(draftId);
  return ok ? { success: true } : { success: false, error: "Commit failed" };
}

async function removeProductFromContract(contractId: string, variantId: string) {
  const gid = variantId.startsWith("gid://")
    ? variantId
    : `gid://shopify/ProductVariant/${variantId}`;

  const d = await gql(
    `query($id:ID!){subscriptionContract(id:$id){lines(first:50){edges{node{id productVariantId}}}}}`,
    { id: contractId }
  );
  const lines = d.data?.subscriptionContract?.lines?.edges ?? [];
  const line = lines.find(
    (e: { node: { productVariantId: string } }) => e.node.productVariantId === gid
  );
  if (!line) return { success: false, error: "Product not found in subscription" };

  const draftId = await createDraft(contractId);
  if (!draftId) return { success: false, error: "Could not create draft" };

  const rd = await gql(
    `mutation($draftId:ID!,$lineId:ID!){
      subscriptionDraftLineRemove(draftId:$draftId,lineId:$lineId){
        draft{id} userErrors{field message}
      }
    }`,
    { draftId, lineId: line.node.id }
  );
  const rerrs = rd.data?.subscriptionDraftLineRemove?.userErrors;
  if (rerrs?.length) return { success: false, error: rerrs[0].message };

  const ok = await commitDraft(draftId);
  return ok ? { success: true } : { success: false, error: "Commit failed" };
}

// ── Route handler ────────────────────────────────────────

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function loader({ request }: { request: Request }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
  return Response.json({ ok: true }, { headers: corsHeaders() });
}

export async function action({ request }: { request: Request }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders() });
  }

  let body: { action?: string; email?: string; variantId?: string; quantity?: number } = {};
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders() });
  }

  const { action, email, variantId, quantity = 1 } = body;
  console.log(`[subscription/manage-products] action=${action} email=${email} variantId=${variantId} qty=${quantity}`);

  if (!email || !variantId || !action) {
    return Response.json({ error: "action, email and variantId are required" }, { status: 400, headers: corsHeaders() });
  }

  try {
    const customerId = await getCustomerId(email);
    if (!customerId) return Response.json({ error: "Customer not found" }, { status: 404, headers: corsHeaders() });

    const contractId = await getActiveContractId(customerId);
    if (!contractId) return Response.json({ error: "No active subscription found" }, { status: 404, headers: corsHeaders() });

    let result;
    if (action === "add") {
      result = await addProductToContract(contractId, variantId, Number(quantity));
    } else if (action === "remove") {
      result = await removeProductFromContract(contractId, variantId);
    } else {
      return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders() });
    }

    return Response.json(result, { headers: corsHeaders() });
  } catch (err) {
    console.error("[subscription/manage-products] Server error:", err);
    return Response.json({ error: "Server error" }, { status: 500, headers: corsHeaders() });
  }
}
