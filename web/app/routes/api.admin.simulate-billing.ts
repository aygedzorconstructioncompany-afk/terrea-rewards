import prisma from "../db.server";

export async function action({ request }: any) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const { customerId } = await request.json();
  const shop = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

  const sub = await prisma.subscription.findFirst({
    where: { customerId: String(customerId), shop }
  });

  if (!sub) return new Response(JSON.stringify({ error: "No subscription" }), { status: 404, headers: corsHeaders });

  const newMonthsActive = (sub.monthsActive || 0) + 1;
  let rate = 0.10;
  if (newMonthsActive >= 7) rate = 0.20;
  else if (newMonthsActive >= 4) rate = 0.15;

  const orderTotal = 50;
  const pointsEarned = Math.floor(orderTotal * rate);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { monthsActive: newMonthsActive, lastOrderAt: new Date() }
  });

  const wallet = await prisma.wallet.upsert({
    where: { shop_customer: { shop, customerId: String(customerId) } },
    create: { shop, customerId: String(customerId), balance: pointsEarned },
    update: { balance: { increment: pointsEarned } }
  });

  await prisma.pointsTransaction.create({
    data: {
      walletId: wallet.id,
      shop,
      customerId: String(customerId),
      type: "cashback",
      amount: pointsEarned,
      description: `Cashback ${Math.round(rate*100)}% — month ${newMonthsActive}`,
    }
  });

  return new Response(JSON.stringify({
    success: true,
    monthsActive: newMonthsActive,
    pointsEarned,
    rate: Math.round(rate * 100)
  }), { status: 200, headers: corsHeaders });
}
