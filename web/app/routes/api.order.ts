import prisma from "../db.server";

export async function action({ request }: any) {
  try {
    const order = await request.json();
    const shop = request.headers.get("x-shopify-shop-domain") || "terrea-home-rituals.myshopify.com";
    const customerId = order.customer?.id?.toString();

    if (!customerId) {
      return Response.json({ ok: true });
    }

    const orderTotal = parseFloat(order.total_price || "0");
    const pointsEarned = Math.floor(orderTotal);

    if (pointsEarned <= 0) {
      return Response.json({ ok: true });
    }

    const wallet = await prisma.wallet.upsert({
      where: { shop_customer: { shop, customerId } },
      update: { balance: { increment: pointsEarned } },
      create: { shop, customerId, balance: pointsEarned },
    });

    await prisma.pointsTransaction.create({
      data: {
        walletId: wallet.id,
        shop,
        customerId,
        orderId: order.id?.toString(),
        type: "EARN",
        amount: pointsEarned,
        description: `Order #${order.order_number} - $${orderTotal}`,
      },
    });

    return Response.json({ ok: true, points: pointsEarned });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Webhook error" }, { status: 500 });
  }
}
