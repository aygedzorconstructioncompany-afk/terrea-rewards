import prisma from "../db.server";

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const { secret, customer_id, amount, type, description, shop } = await request.json();

    if (secret !== "terrea-admin-2024") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const shopId = shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

    if (!customer_id || amount === undefined) {
      return new Response(JSON.stringify({ error: "Missing customer_id or amount" }), { status: 400 });
    }

    const wallet = await prisma.wallet.upsert({
      where: { shop_customer: { shop: shopId, customerId: String(customer_id) } },
      create: { shop: shopId, customerId: String(customer_id), balance: amount, totalSpent: 0, tier: "start" },
      update: { balance: { increment: amount } },
    });

    await prisma.pointsTransaction.create({
      data: {
        walletId: wallet.id,
        shop: shopId,
        customerId: String(customer_id),
        type: type || "admin_adjustment",
        amount,
        description: description || `Admin adjustment: ${amount > 0 ? "+" : ""}${amount} pts`,
      },
    });

    const updated = await prisma.wallet.findUnique({
      where: { shop_customer: { shop: shopId, customerId: String(customer_id) } },
    });

    return new Response(JSON.stringify({ success: true, newBalance: updated?.balance }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
