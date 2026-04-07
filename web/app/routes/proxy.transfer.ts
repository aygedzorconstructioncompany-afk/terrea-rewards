import prisma from "../db.server";

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export const action = async ({ request }) => {
  try {
    const body = await request.json();

    const { fromCustomerId, toCustomerId, points } = body;

    if (!fromCustomerId || !toCustomerId) {
      return jsonResponse({ error: "Missing customer id" }, 400);
    }

    if (points <= 0) {
      return jsonResponse({ error: "Invalid points amount" }, 400);
    }

    const senderWallet = await prisma.wallet.findUnique({
      where: { customerId: fromCustomerId },
    });

    if (!senderWallet || senderWallet.balance < points) {
      return jsonResponse({ error: "Not enough points" }, 400);
    }

    /* 🔥 ТРАНЗАКЦИЯ (очень важно) */
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { customerId: fromCustomerId },
        data: {
          balance: { decrement: points },
        },
      });

      await tx.wallet.upsert({
        where: { customerId: toCustomerId },
        update: {
          balance: { increment: points },
        },
        create: {
          customerId: toCustomerId,
          balance: points,
        },
      });

      const expires = new Date();
      expires.setMonth(expires.getMonth() + 6);

      await tx.pointsTransaction.create({
        data: {
          customerId: fromCustomerId,
          orderId: "transfer-out",
          type: "transfer",
          points: -points,
          expiresAt: expires,
        },
      });

      await tx.pointsTransaction.create({
        data: {
          customerId: toCustomerId,
          orderId: "transfer-in",
          type: "transfer",
          points: points,
          expiresAt: expires,
        },
      });
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: "Transfer failed" }, 500);
  }
};