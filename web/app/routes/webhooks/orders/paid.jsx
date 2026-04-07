import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";

export const action = async ({ request }) => {

  console.log("🔥 ORDERS_PAID WEBHOOK RECEIVED");

  const { payload } = await authenticate.webhook(request);

  const order = payload;

  console.log("Order ID:", order.id);

  const customerId = order.customer?.id?.toString();

  if (!customerId) {
    console.log("No customer");
    return new Response("No customer", { status: 200 });
  }

  const orderTotal = Number(order.total_price);

  // 1$ = 1 point
  const pointsEarned = Math.floor(orderTotal);

  console.log("Points earned:", pointsEarned);

  try {

    const wallet = await prisma.wallet.upsert({
      where: { customerId },
      update: {
        balance: {
          increment: pointsEarned
        }
      },
      create: {
        customerId,
        balance: pointsEarned
      }
    });

    await prisma.pointsTransaction.create({
      data: {
        customerId,
        orderId: order.id.toString(),
        type: "earn",
        points: pointsEarned
      }
    });

    console.log("✅ Points added to wallet");

    return new Response("OK");

  } catch (error) {

    console.error("❌ Points error:", error);

    return new Response("Error", { status: 500 });

  }

};