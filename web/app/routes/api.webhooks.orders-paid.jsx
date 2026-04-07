import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    const order = await request.json();

    const customerId = order.customer?.id?.toString();
    const shop = request.headers.get("x-shopify-shop-domain");

    if (!customerId) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const note = order.note || "";
    const match = note.match(/USED_POINTS:(\d+)/);

    if (!match) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const usedPoints = parseInt(match[1], 10);

    if (!usedPoints || usedPoints <= 0) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        customerId,
        shop,
      },
    });

    if (!wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: usedPoints,
          },
        },
      }),

      prisma.pointsTransaction.create({
        data: {
          walletId: wallet.id,
          shop,
          customerId,
          orderId: order.id.toString(),
          type: "SPEND",
          amount: -usedPoints,
          description: "Redeemed points",
        },
      }),
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);

    return new Response(JSON.stringify({ error: "Webhook error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};