import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function action({ request }: any) {
  const { customerId } = await request.json();
  const shop = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

  const sub = await prisma.subscription.findFirst({
    where: { customerId: String(customerId), shop }
  });

  if (!sub) return json({ error: "No subscription" }, { status: 404 });

  const newMonthsActive = (sub.monthsActive || 0) + 1;

  // Определяем тир и кэшбэк
  let rate = 0.10;
  if (newMonthsActive >= 7) rate = 0.20;
  else if (newMonthsActive >= 4) rate = 0.15;

  // Симулируем сумму заказа £50
  const orderTotal = 50;
  const pointsEarned = Math.floor(orderTotal * rate);

  // Обновляем подписку
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      monthsActive: newMonthsActive,
      lastOrderAt: new Date(),
      startedAt: sub.startedAt || new Date(),
    }
  });

  // Обновляем кошелёк
  const wallet = await prisma.wallet.upsert({
    where: { shop_customer: { shop, customerId: String(customerId) } },
    create: { shop, customerId: String(customerId), balance: pointsEarned },
    update: { balance: { increment: pointsEarned } }
  });

  // Записываем транзакцию
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

  return json({
    success: true,
    monthsActive: newMonthsActive,
    pointsEarned,
    newBalance: wallet.balance + pointsEarned,
    rate: Math.round(rate * 100)
  });
}
