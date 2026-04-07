import { json } from "@remix-run/node";
import { prisma } from "~/db.server";

// 👉 GET /api/wallet
export const loader = async ({ request }: { request: Request }) => {
  try {
    const url = new URL(request.url);

    const customerId =
      url.searchParams.get("logged_in_customer_id") ||
      url.searchParams.get("customerId") ||
      "demo-user";

    // 👉 ищем кошелек
    let wallet = await prisma.wallet.findUnique({
      where: { customerId },
    });

    // 👉 если нет — создаём
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          customerId,
          balance: 0,
        },
      });
    }

    return json({
      points: wallet.balance,
      totalSpent: 0,
    });
  } catch (e) {
    console.error("Wallet loader error:", e);

    return json({
      points: 0,
      totalSpent: 0,
    });
  }
};

// 👉 POST /api/wallet (например начисление)
export const action = async ({ request }: { request: Request }) => {
  try {
    const body = await request.json();

    const { customerId, points } = body;

    if (!customerId || !points) {
      return json({ error: "Missing data" }, { status: 400 });
    }

    // 👉 обновляем баланс
    const wallet = await prisma.wallet.upsert({
      where: { customerId },
      update: {
        balance: {
          increment: points,
        },
      },
      create: {
        customerId,
        balance: points,
      },
    });

    return json({
      success: true,
      balance: wallet.balance,
    });
  } catch (e) {
    console.error("Wallet action error:", e);

    return json({ error: "Failed" }, { status: 500 });
  }
};