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

export async function loader({ request }: any) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const { customer_id, shop, action: subAction } = await request.json();
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
          currentTier: "bronze",
          pendingPoints: 0,
        }
      });
    }

    if (subAction === "pause") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "paused" }
      });
      return Response.json({ success: true, status: "paused", message: "Subscription paused" }, { headers: corsHeaders(request) });
    }

    if (subAction === "cancel") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "cancelled", monthsActive: 0, pendingPoints: 0 }
      });
      return Response.json({ success: true, status: "cancelled", message: "Subscription cancelled. Progress reset." }, { headers: corsHeaders(request) });
    }

    if (subAction === "resume") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "active" }
      });
      return Response.json({ success: true, status: "active", message: "Subscription resumed!" }, { headers: corsHeaders(request) });
    }

    return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders(request) });

  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
