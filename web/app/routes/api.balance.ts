import prisma from "../db.server";

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const customerId = url.searchParams.get("customer_id");
  const shop = url.searchParams.get("shop") || "terrea-home-rituals.myshopify.com";
  const amount = parseInt(url.searchParams.get("amount") || "0");
  const type = url.searchParams.get("type") || "referral_bonus";
  const description = url.searchParams.get("description") || "Manual bonus";

  if (secret !== "terrea-admin-2024") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (!customerId || amount <= 0) {
    return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
  }

  try {
    const wallet = await prisma.wallet.upsert({
      where: { shop_customer: { shop, customerId } },
      create: { shop, customerId, balance: amount, totalSpent: 0, tier: "stay" },
      update: { balance: { increment: amount } },
    });

    await prisma.pointsTransaction.create({
      data: {
        walletId: wallet.id,
        shop,
        customerId,
        type,
        amount,
        description,
      },
    });

    return new Response(JSON.stringify({ success: true, balance: wallet.balance + amount }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
