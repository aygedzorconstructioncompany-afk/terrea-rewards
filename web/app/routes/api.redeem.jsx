import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function action({ request }) {
  try {
    const { customerId, points } = await request.json();
    const shop = "terrea-dev-store.myshopify.com";

    const wallet = await prisma.wallet.findFirst({
      where: { shop }
    });

    if (!wallet || wallet.balance < 500) {
      return Response.json({ error: "Insufficient points" }, { status: 400 });
    }

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: 500 } }
    });

    const code = "REWARD-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    await prisma.pointsTransaction.create({
      data: {
        walletId: wallet.id,
        shop,
        customerId: wallet.customerId,
        amount: -500,
        type: "REDEEM",
        description: "Redeemed for discount: " + code
      }
    });

    return Response.json({ success: true, code });
  } catch (e) {
    console.error("Redeem error:", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}