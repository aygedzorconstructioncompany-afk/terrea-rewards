import prisma from "../db.server";
import type { ActionFunctionArgs } from "@remix-run/node";

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const body = await request.json();
    const { customerId, points } = body;

    if (!customerId) {
      return jsonResponse({ error: "No customerId" }, 400);
    }

    if (!points || points <= 0) {
      return jsonResponse({ error: "Invalid points" }, 400);
    }

    const wallet = await prisma.wallet.findFirst({
      where: { customerId },
    });

    if (!wallet) {
      return jsonResponse({ error: "Wallet not found" }, 404);
    }

    if (wallet.balance < points) {
      return jsonResponse({ error: "Not enough points" }, 400);
    }

    // ❗ НЕ списываем баланс

    await prisma.pointsTransaction.create({
      data: {
        customerId: customerId, // ✅ ВОТ ЭТО ДОБАВИЛИ
        type: "redeem_pending",
        amount: -points,
        walletId: wallet.id,
        shop: wallet.shop,
      },
    });

    return jsonResponse({
      success: true,
      message: "Redeem pending created",
    });

  } catch (error) {
    console.error("REDEEM ERROR:", error);

    return jsonResponse(
      { error: "Redeem failed" },
      500
    );
  }
};