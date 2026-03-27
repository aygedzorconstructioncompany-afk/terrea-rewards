import { json } from "@remix-run/node";
import prisma from "../../db.server";

export async function loader({ request }) {
  try {
    // 👉 получаем customerId из query (App Proxy)
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customer_id");

    if (!customerId) {
      return json({ points: 0, transactions: [] });
    }

    // 👉 ищем кошелек
    let wallet = await prisma.wallet.findUnique({
      where: { customerId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    // 👉 если нет — создаём
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          customerId,
          balance: 0,
        },
        include: {
          transactions: true,
        },
      });
    }

    return json({
      points: wallet.balance,
      transactions: wallet.transactions,
    });

  } catch (e) {
    console.error(e);
    return json({ points: 0, transactions: [] });
  }
}


export async function action({ request }) {
  try {
    const body = await request.json();
    const { customerId, points } = body;

    if (!customerId) {
      return json({ success: false });
    }

    let wallet = await prisma.wallet.findUnique({
      where: { customerId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          customerId,
          balance: 0,
        },
      });
    }

    const updated = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: points || 0,
        },
      },
    });

    // 👉 сохраняем транзакцию
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount: points || 0,
        type: "earn",
        description: "Manual add",
      },
    });

    return json({
      success: true,
      points: updated.balance,
    });

  } catch (e) {
    console.error("POST ERROR:", e);
    return json({ success: false });
  }
}