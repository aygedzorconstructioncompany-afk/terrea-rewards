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
    const { customer_id, to_email, points, shop } = await request.json();
    const shopId = shop || "terrea-dev-store.myshopify.com";

    if (!customer_id || !to_email || !points) {
      return Response.json({ error: "Missing data" }, { status: 400, headers: corsHeaders(request) });
    }

    if (points < 10) {
      return Response.json({ error: "Minimum transfer is 10 pts" }, { status: 400, headers: corsHeaders(request) });
    }

    // Найти кошелёк отправителя
    const senderWallet = await prisma.wallet.findFirst({
      where: { shop: shopId, customerId: String(customer_id) },
    });

    if (!senderWallet) {
      return Response.json({ error: "Sender wallet not found" }, { status: 404, headers: corsHeaders(request) });
    }

    if (senderWallet.balance < points) {
      return Response.json({ error: "Insufficient points" }, { status: 400, headers: corsHeaders(request) });
    }

    // Найти получателя по email через Shopify Customer API
    // Для теста ищем по customerId в нашей базе
    const receiverWallet = await prisma.wallet.findFirst({
      where: { shop: shopId, customerId: { not: String(customer_id) } },
    });

    if (!receiverWallet) {
      return Response.json({ error: "Recipient not found" }, { status: 404, headers: corsHeaders(request) });
    }

    const expiresAt = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      // Списать у отправителя
      prisma.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: points } },
      }),
      prisma.pointsTransaction.create({
        data: {
          walletId: senderWallet.id,
          shop: shopId,
          customerId: String(customer_id),
          type: "transfer_out",
          amount: -points,
          description: `Transfer to ${to_email}: -${points} pts`,
        },
      }),
      // Начислить получателю
      prisma.wallet.update({
        where: { id: receiverWallet.id },
        data: { balance: { increment: points } },
      }),
      prisma.pointsTransaction.create({
        data: {
          walletId: receiverWallet.id,
          shop: shopId,
          customerId: receiverWallet.customerId,
          type: "transfer_in",
          amount: points,
          description: `Transfer received: +${points} pts`,
          expiresAt,
        },
      }),
    ]);

    return Response.json({
      success: true,
      message: `Successfully transferred ${points} pts!`,
    }, { headers: corsHeaders(request) });

  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}