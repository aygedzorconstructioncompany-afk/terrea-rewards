import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader() {
  const wallet = await prisma.wallet.findFirst({
    where: { shop: "terrea-dev-store.myshopify.com" },
  });
  return Response.json({ debug: true, balance: wallet?.balance, id: wallet?.id });
}

export async function action({ request }: any) {
  try {
    const { customerId } = await request.json();

    const wallet = await prisma.wallet.findFirst({
      where: { shop: "terrea-dev-store.myshopify.com" },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!wallet) {
      return Response.json({ balance: 0, transactions: [] });
    }

    return Response.json({
      balance: wallet.balance,
      transactions: wallet.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt,
      })),
    });
  } catch (e) {
    console.error("Balance error:", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}