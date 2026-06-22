import { prisma } from "~/db.server";

const SHOP = process.env.SHOPIFY_SHOP!;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const API_VERSION = "2024-01";

async function shopifyGraphQL(query: string, variables: Record<string, unknown> = {}) {
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
  return res.json();
}

// Найти customer ID по email
async function getCustomerId(email: string): Promise<string | null> {
  const data = await shopifyGraphQL(
    `query($q: String!) {
      customers(first: 1, query: $q) {
        edges { node { id } }
      }
    }`,
    { q: `email:${email}` }
  );
  return data.data?.customers?.edges?.[0]?.node?.id ?? null;
}

// Найти активный subscription contract
async function getActiveContractId(customerId: string): Promise<string | null> {
  const data = await shopifyGraphQL(
    `query($id: ID!) {
      customer(id: $id) {
        subscriptionContracts(first: 10) {
          edges {
            node {
              id
              status
            }
          }
        }
      }
    }`,
    { id: customerId }
  );
  const contracts = data.data?.customer?.subscriptionContracts?.edges ?? [];
  const active = contracts.find(
    (e: { node: { status: string } }) =>
      e.node.status === "ACTIVE" || e.node.status === "PAUSED"
  );
  return active?.node?.id ?? null;
}

// Создать черновик ревизии контракта
async function createDraft(contractId: string): Promise<string | null> {
  const data = await shopifyGraphQL(
    `mutation($id: ID!) {
      subscriptionContractCreateRevision(contractId: $id) {
        draft { id }
        userErrors { field message }
      }
    }`,
    { id: contractId }
  );
  const errors = data.data?.subscriptionContractCreateRevision?.userErrors;
  if (errors?.length) {
    console.error("Draft errors:", errors);
    return null;
  }
  return data.data?.subscriptionContractCreateRevision?.draft?.id ?? null;
}

// Добавить товар в черновик
async function addLineToDraft(
  draftId: string,
  variantId: string,
  quantity: number
): Promise<boolean> {
  // variantId из Shopify storefront выглядит как числовой ID
  // нужен GID формат: gid://shopify/ProductVariant/12345
  const gid = variantId.startsWith("gid://")
    ? variantId
    : `gid://shopify/ProductVariant/${variantId}`;

  const data = await shopifyGraphQL(
    `mutation($draftId: ID!, $input: SubscriptionLineInput!) {
      subscriptionDraftLineAdd(draftId: $draftId, input: $input) {
        draft { id }
        lineAdded { id quantity }
        userErrors { field message }
      }
    }`,
    {
      draftId,
      input: {
        productVariantId: gid,
        quantity,
        currentPrice: "0",  // Shopify обновит цену автоматически
        recurringPrice: "0",
      },
    }
  );
  const errors = data.data?.subscriptionDraftLineAdd?.userErrors;
  if (errors?.length) {
    console.error("Add line errors:", errors);
    return false;
  }
  return !!data.data?.subscriptionDraftLineAdd?.lineAdded;
}

// Зафиксировать черновик
async function commitDraft(draftId: string): Promise<boolean> {
  const data = await shopifyGraphQL(
    `mutation($id: ID!) {
      subscriptionDraftCommit(draftId: $id) {
        contract { id }
        userErrors { field message }
      }
    }`,
    { id: draftId }
  );
  const errors = data.data?.subscriptionDraftCommit?.userErrors;
  if (errors?.length) {
    console.error("Commit errors:", errors);
    return false;
  }
  return !!data.data?.subscriptionDraftCommit?.contract?.id;
}

// Удалить товар из подписки (найти line по variantId и удалить)
async function removeProductFromContract(
  contractId: string,
  variantId: string
): Promise<boolean> {
  // Получить линии контракта
  const gid = variantId.startsWith("gid://")
    ? variantId
    : `gid://shopify/ProductVariant/${variantId}`;

  const data = await shopifyGraphQL(
    `query($id: ID!) {
      subscriptionContract(id: $id) {
        lines(first: 50) {
          edges { node { id productVariantId } }
        }
      }
    }`,
    { id: contractId }
  );
  const lines = data.data?.subscriptionContract?.lines?.edges ?? [];
  const line = lines.find(
    (e: { node: { productVariantId: string } }) =>
      e.node.productVariantId === gid
  );
  if (!line) return false;

  const draftId = await createDraft(contractId);
  if (!draftId) return false;

  const removeData = await shopifyGraphQL(
    `mutation($draftId: ID!, $lineId: ID!) {
      subscriptionDraftLineRemove(draftId: $draftId, lineId: $lineId) {
        draft { id }
        userErrors { field message }
      }
    }`,
    { draftId, lineId: line.node.id }
  );
  const removeErrors = removeData.data?.subscriptionDraftLineRemove?.userErrors;
  if (removeErrors?.length) return false;

  return commitDraft(draftId);
}

// ── Handlers ──────────────────────────────────────────────

export async function addProduct(email: string, variantId: string, quantity: number) {
  const customerId = await getCustomerId(email);
  if (!customerId) return { success: false, error: "Customer not found" };

  const contractId = await getActiveContractId(customerId);
  if (!contractId) return { success: false, error: "No active subscription found" };

  const draftId = await createDraft(contractId);
  if (!draftId) return { success: false, error: "Could not create revision" };

  const added = await addLineToDraft(draftId, variantId, quantity);
  if (!added) return { success: false, error: "Could not add product" };

  const committed = await commitDraft(draftId);
  if (!committed) return { success: false, error: "Could not save changes" };

  return { success: true };
}

export async function removeProduct(email: string, variantId: string) {
  const customerId = await getCustomerId(email);
  if (!customerId) return { success: false, error: "Customer not found" };

  const contractId = await getActiveContractId(customerId);
  if (!contractId) return { success: false, error: "No active subscription found" };

  const removed = await removeProductFromContract(contractId, variantId);
  if (!removed) return { success: false, error: "Could not remove product" };

  return { success: true };
}
