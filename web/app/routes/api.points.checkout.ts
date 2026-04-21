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

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const { customer_id, order_total, points_to_use, shop } = await request.json();
    const shopId = shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

    if (!customer_id || !order_total || !points_to_use) {
      return Response.json({ error: "Missing data" }, { status: 400, headers: corsHeaders(request) });
    }

    // Максимум 50% от заказа
    const maxDiscount = Math.floor(order_total * 0.5);
    const discount = Math.min(points_to_use, maxDiscount);

    if (discount < 10) {
      return Response.json({ error: "Minimum 10 pts to use" }, { status: 400, headers: corsHeaders(request) });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { shop: shopId, customerId: String(customer_id) }
    });

    if (!wallet) {
      return Response.json({ error: "Wallet not found" }, { status: 404, headers: corsHeaders(request) });
    }

    if (wallet.balance < discount) {
      return Response.json({ error: "Not enough points" }, { status: 400, headers: corsHeaders(request) });
    }

    // Списываем баллы
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: discount } }
    });

    // Создаём discount code в Shopify
    const code = "POINTS-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    await prisma.pointsTransaction.create({
      data: {
        walletId: wallet.id,
        shop: shopId,
        customerId: String(customer_id),
        type: "checkout",
        amount: -discount,
        description: `Used ${discount} pts for $${discount} discount at checkout`,
      }
    });

    return Response.json({
      success: true,
      code,
      discount,
      message: `Use code ${code} for $${discount} off your order!`
    }, { headers: corsHeaders(request) });

  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
