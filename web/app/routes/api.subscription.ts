import prisma from "../db.server";

const corsHeaders = (request: any) => {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
    "Access-Control-Allow-Credentials": "true",
  };
};

function getTier(monthsActive: number): { tier: string; rate: number; next: string | null; monthsToNext: number } {
  if (monthsActive >= 7) return { tier: "gold", rate: 0.20, next: null, monthsToNext: 0 };
  if (monthsActive >= 4) return { tier: "silver", rate: 0.15, next: "gold", monthsToNext: 7 - monthsActive };
  return { tier: "bronze", rate: 0.10, next: "silver", monthsToNext: 4 - monthsActive };
}

export async function loader({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  const shop = url.searchParams.get("shop") || "terrea-dev-store.myshopify.com";

  if (!customerId) {
    return Response.json({ error: "No customer_id" }, { status: 400, headers: corsHeaders(request) });
  }

  try {
    const sub = await prisma.subscription.findFirst({
      where: { shop, customerId: String(customerId) }
    });

    if (!sub) {
      return Response.json({
        active: false,
        monthsActive: 0,
        tier: "bronze",
        rate: 10,
        pendingPoints: 0,
        next: "silver",
        monthsToNext: 4,
      }, { headers: corsHeaders(request) });
    }

    const tierInfo = getTier(sub.monthsActive);

    return Response.json({
      active: sub.status === "active",
      monthsActive: sub.monthsActive,
      tier: sub.currentTier,
      rate: Math.round(tierInfo.rate * 100),
      pendingPoints: sub.pendingPoints,
      next: tierInfo.next,
      monthsToNext: tierInfo.monthsToNext,
      startedAt: sub.startedAt,
      lastOrderAt: sub.lastOrderAt,
    }, { headers: corsHeaders(request) });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}