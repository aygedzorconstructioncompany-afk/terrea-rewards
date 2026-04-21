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
    const now = new Date();

    // Найти истёкшие транзакции
    const expiredTx = await prisma.pointsTransaction.findMany({
      where: {
        customerId: String(customerId),
        shop,
        expiresAt: { lte: now },
        type: { in: ["earn", "referral"] },
      },
    });

    // Считаем сколько баллов истекло
    const expiredPoints = expiredTx.reduce((sum: number, tx: any) => {
      return sum + (tx.amount > 0 ? tx.amount : 0);
    }, 0);

    // Найти следующую дату истечения
    const nextExpiry = await prisma.pointsTransaction.findFirst({
      where: {
        customerId: String(customerId),
        shop,
        expiresAt: { gt: now },
        type: { in: ["earn", "referral"] },
        amount: { gt: 0 },
      },
      orderBy: { expiresAt: "asc" },
    });

    return Response.json({
      expiredPoints,
      nextExpiryDate: nextExpiry?.expiresAt || null,
      expiredCount: expiredTx.length,
    }, { headers: corsHeaders(request) });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
