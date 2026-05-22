import prisma from "../db.server";

const corsHeaders = (request: any) => {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
    "Access-Control-Allow-Credentials": "true",
  };
};

function getTier(monthsActive: number) {
  if (monthsActive >= 10) return { tier: "belong+", rate: 0.20, next: null, monthsToNext: 0 };
  if (monthsActive >= 7)  return { tier: "belong",  rate: 0.20, next: "belong+", monthsToNext: 10 - monthsActive };
  if (monthsActive >= 4)  return { tier: "stay",    rate: 0.15, next: "belong",  monthsToNext: 7 - monthsActive };
  return                         { tier: "start",   rate: 0.10, next: "stay",    monthsToNext: 4 - monthsActive };
}

async function fetchShopProducts(shop: string): Promise<any[]> {
  try {
    const session = await prisma.session.findFirst({ where: { shop } });
    if (!session?.accessToken) return [];
    const resp = await fetch(
      `https://${shop}/admin/api/2024-01/products.json?limit=250&fields=id,title,images`,
      { headers: { "X-Shopify-Access-Token": session.accessToken } }
    );
    if (!resp.ok) return [];
    const data = await resp.json() as any;
    return data.products || [];
  } catch { return []; }
}

export async function loader({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

  if (!customerId) {
    return Response.json({ error: "No customer_id" }, { status: 400, headers: corsHeaders(request) });
  }
  try {
    const sub = await prisma.subscription.findFirst({
      where: { shop, customerId: String(customerId) }
    });
    const allProducts = await fetchShopProducts(shop);

    if (!sub) {
      return Response.json({
        active: false, monthsActive: 0, tier: "start", rate: 10,
        pendingPoints: 0, next: "stay", monthsToNext: 4,
        subscribedProducts: [], allProducts,
      }, { headers: corsHeaders(request) });
    }

    const tierInfo = getTier(sub.monthsActive);
    let subscribedProducts: string[] = [];
    try { subscribedProducts = sub.products ? JSON.parse(sub.products) : []; } catch {}

    return Response.json({
      active: sub.status === "active",
      status: sub.status,
      monthsActive: sub.monthsActive,
      tier: tierInfo.tier,
      rate: Math.round(tierInfo.rate * 100),
      pendingPoints: sub.pendingPoints,
      next: tierInfo.next,
      monthsToNext: tierInfo.monthsToNext,
      startedAt: sub.startedAt,
      lastOrderAt: sub.lastOrderAt,
      subscribedProducts,
      allProducts,
    }, { headers: corsHeaders(request) });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

  try {
    const body = await request.json();
    const { customer_id, action: act, products } = body;

    if (!customer_id) {
      return Response.json({ error: "No customer_id" }, { status: 400, headers: corsHeaders(request) });
    }

    if (act === "update_products") {
      const sub = await prisma.subscription.findFirst({
        where: { shop, customerId: String(customer_id) }
      });
      if (!sub) {
        await prisma.subscription.create({
          data: { shop, customerId: String(customer_id), status: "active", products: JSON.stringify(products || []) }
        });
      } else {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { products: JSON.stringify(products || []) }
        });
      }
      return Response.json({ success: true }, { headers: corsHeaders(request) });
    }

    if (act === "pause" || act === "resume" || act === "cancel") {
      const statusMap: Record<string, string> = { pause: "paused", resume: "active", cancel: "cancelled" };
      await prisma.subscription.updateMany({
        where: { shop, customerId: String(customer_id) },
        data: { status: statusMap[act] }
      });
      return Response.json({ success: true }, { headers: corsHeaders(request) });
    }

    if (act === "create") {
      const existing = await prisma.subscription.findFirst({
        where: { shop, customerId: String(customer_id) }
      });
      if (!existing) {
        await prisma.subscription.create({
          data: { shop, customerId: String(customer_id), status: "active", products: JSON.stringify(products || []) }
        });
      } else {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: { status: "active" }
        });
      }
      return Response.json({ success: true }, { headers: corsHeaders(request) });
    }

    return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders(request) });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
