import { json } from "@remix-run/node";
import prisma from "~/db.server";

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
