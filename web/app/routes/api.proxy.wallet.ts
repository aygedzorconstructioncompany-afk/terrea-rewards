import prisma from "../db.server";

export async function loader({ request }: any) {
  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customer_id");
    const shop = url.searchParams.get("shop") || "terrea-home-rituals.myshopify.com";

    if (!customerId) {
      return Response.json({ error: "No customerId" }, { status: 400 });
    }

    let wallet = await prisma.wallet.findFirst({
      where: { customerId, shop },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
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
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function action({ request }: any) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.endsWith("/redeem")) {
      const { customer_id, points } = await request.json();
      const shop = "terrea-home-rituals.myshopify.com";

      const wallet = await prisma.wallet.findFirst({
        where: { customerId: String(customer_id), shop },
      });

      if (!wallet || wallet.balance < 500) {
        return Response.json({ error: "Insufficient points" }, { status: 400 });
      }

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: 500 } },
      });

      const code = "REWARD-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      await prisma.pointsTransaction.create({
        data: {
          walletId: wallet.id,
          shop,
          customerId: String(customer_id),
          amount: -500,
          type: "REDEEM",
          description: "Redeemed for discount: " + code,
        },
      });

      return Response.json({ success: true, code });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
