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

async function updateShopifyContract(shop: string, contractId: string, action: string) {
  const API_URL = `https://${shop}/admin/api/2024-01/graphql.json`;

  const mutations: Record<string, string> = {
    pause:  `mutation { subscriptionContractPause(subscriptionContractId: "${contractId}") { contract { id status } userErrors { field message } } }`,
    cancel: `mutation { subscriptionContractCancel(subscriptionContractId: "${contractId}") { contract { id status } userErrors { field message } } }`,
    resume: `mutation { subscriptionContractActivate(subscriptionContractId: "${contractId}") { contract { id status } userErrors { field message } } }`,
  };

  const query = mutations[action];
  if (!query) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    console.log(`[shopify contract ${action}]`, JSON.stringify(data));
  } catch (e: any) {
    console.error(`[shopify contract ${action}] Error:`, e.message);
  }
}

export async function loader({ request }: any) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const { customer_id, shop, action: subAction, email, tier } = await request.json();
    const shopId = shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

    if (!customer_id || !subAction) {
      return Response.json({ error: "Missing data" }, { status: 400, headers: corsHeaders(request) });
    }

    let sub = await prisma.subscription.findFirst({
      where: { shop: shopId, customerId: String(customer_id) }
    });

    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          shop: shopId,
          customerId: String(customer_id),
          status: "active",
          monthsActive: 0,
          currentTier: "start",
          pendingPoints: 0,
        }
      });
    }

    if (subAction === "pause") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "paused" }
      });
      if (sub.subscriptionContractId) {
        await updateShopifyContract(shopId, sub.subscriptionContractId, "pause");
      }
      return Response.json({ success: true, status: "paused", message: "Subscription paused" }, { headers: corsHeaders(request) });
    }

    if (subAction === "cancel") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "cancelled", monthsActive: 0, pendingPoints: 0 }
      });
      if (sub.subscriptionContractId) {
        await updateShopifyContract(shopId, sub.subscriptionContractId, "cancel");
      }
      return Response.json({ success: true, status: "cancelled", message: "Subscription cancelled. Progress reset." }, { headers: corsHeaders(request) });
    }

    if (subAction === "resume") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "active" }
      });
      // Сохраняем email и tier в Wallet
      await prisma.wallet.upsert({
        where: { shop_customer: { shop: shopId, customerId: String(customer_id) } },
        create: {
          shop: shopId,
          customerId: String(customer_id),
          email: email || '',
          balance: 0,
          totalSpent: 0,
          tier: tier || 'start'
        },
        update: {
          ...(email ? { email } : {}),
          tier: tier || 'start'
        }
      });
      if (sub.subscriptionContractId) {
        await updateShopifyContract(shopId, sub.subscriptionContractId, "resume");
      }
      return Response.json({ success: true, status: "active", message: "Subscription resumed!" }, { headers: corsHeaders(request) });
    }

    return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders(request) });

  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
