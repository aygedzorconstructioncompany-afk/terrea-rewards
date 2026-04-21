import prisma from "../db.server";

/* ===== LOYALTY ENGINE ===== */
function getTier(totalSpent) {
  if (totalSpent >= 1000) {
    return { name: "Gold", cashback: 0.2 };
  }
  if (totalSpent >= 500) {
    return { name: "Silver", cashback: 0.15 };
  }
  return { name: "Basic", cashback: 0.1 };
}

export const action = async ({ request }) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body = await request.json();

    const shop = "terrea-home-rituals.myshopify.com";
    const customerId = body.customer?.id?.toString();
    const orderId = String(body.id);
    const totalPrice = parseFloat(body.total_price || "0");

    if (!customerId) return new Response("OK");

    const existing = await prisma.pointsTransaction.findFirst({
      where: { orderId },
    });

    if (existing) {
      return new Response("Already processed");
    }

    let wallet = await prisma.wallet.findFirst({
      where: { customerId, shop },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          shop,
          customerId,
          balance: 0,
          totalSpent: 0,
          tier: "Basic",
        },
      });
    }

    const newTotalSpent = wallet.totalSpent + totalPrice;
    const tier = getTier(newTotalSpent);
    const points = Math.floor(totalPrice * tier.cashback);

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: points },
        totalSpent: newTotalSpent,
        tier: tier.name,
      },
    });

    await prisma.pointsTransaction.create({
      data: {
        walletId: wallet.id,
        shop,
        customerId,
        orderId,
        type: "EARN",
        amount: points,
        description: `Cashback ${tier.cashback * 100}%`,
      },
    });

    return new Response(JSON.stringify({ success: true }));

  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return new Response("Error", { status: 500 });
  }
};
