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

  if (!sub) {
    return new Response(JSON.stringify({ error: "No subscription" }), { status: 404, headers: corsHeaders });
  }

  const newMonthsActive = (sub.monthsActive || 0) + 1;

  // Определяем ставку кэшбэка
  let rate = 0.10;
  if (newMonthsActive >= 7) rate = 0.20;
  else if (newMonthsActive >= 4) rate = 0.15;

  const orderTotal = 50;
  const pointsEarned = Math.floor(orderTotal * rate);

  // Баллы выплачиваются на 4-й, 7-й, 10-й месяц
  const isPayoutMonth = [4, 7, 10].includes(newMonthsActive);

  // Накапливаем pending
  const newPending = (sub.pendingPoints || 0) + pointsEarned;

  let walletIncrement = 0;
  let finalPending = newPending;

  if (isPayoutMonth) {
    // Выплачиваем все накопленные баллы
    walletIncrement = newPending;
    finalPending = 0;
  }

  // Обновляем подписку
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      monthsActive: newMonthsActive,
      lastOrderAt: new Date(),
      pendingPoints: finalPending,
    }
  });

  // Записываем транзакцию (pending или реальная)
  const wallet = await prisma.wallet.upsert({
    where: { shop_customer: { shop, customerId: String(customerId) } },
    create: { shop, customerId: String(customerId), balance: walletIncrement },
    update: walletIncrement > 0 ? { balance: { increment: walletIncrement } } : {}
  });

  await prisma.pointsTransaction.create({
    data: {
      walletId: wallet.id,
      shop,
      customerId: String(customerId),
      type: isPayoutMonth ? "cashback" : "cashback_pending",
      amount: pointsEarned,
      description: isPayoutMonth
        ? `Cashback ${Math.round(rate * 100)}% — month ${newMonthsActive} (PAID OUT: ${walletIncrement} pts)`
        : `Cashback ${Math.round(rate * 100)}% — month ${newMonthsActive} (pending, pays on month ${newMonthsActive <= 3 ? 4 : newMonthsActive <= 6 ? 7 : 10})`,
    }
  });

  return new Response(JSON.stringify({
    success: true,
    monthsActive: newMonthsActive,
    pointsEarned,
    rate: Math.round(rate * 100),
    pendingPoints: finalPending,
    paidOut: walletIncrement,
    isPayoutMonth,
    walletBalance: wallet.balance,
  }), { status: 200, headers: corsHeaders });
}
