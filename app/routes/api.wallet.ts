import { data } from "react-router";
import { prisma } from "~/db.server";

export const loader = async ({ request }: { request: Request }) => {
  try {
    // 👉 получаем customerId из query (через App Proxy)
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customer_id");

    // 👉 если нет customerId
    if (!customerId) {
      return {
        points: 0,
        transactions: [],
      };
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

    // 👉 если нет — создаем
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

    return {
      points: wallet.balance,
      transactions: wallet.transactions,
    };

  } catch (error) {
    console.error("API WALLET ERROR:", error);

    return data(
      {
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
};
