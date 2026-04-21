import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const shop = request.headers.get("x-shopify-shop-domain") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
    const payload = await request.json();
    const customerId = payload.customer_id?.toString();

    if (!customerId) return new Response("No customer", { status: 400 });

    // Найти подписку
    const sub = await prisma.subscription.findFirst({
      where: { shop, customerId },
    });

    if (!sub) return new Response("Subscription not found", { status: 404 });

    const oldMonths = sub.monthsActive;
    const newMonths = oldMonths + 1;

    // Обновить тир
    const newTier =
      newMonths >= 10 ? "belong+" :
      newMonths >= 7  ? "belong"  :
      newMonths >= 4  ? "stay"    : "start";

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        monthsActive: newMonths,
        currentTier: newTier,
      },
    });

    // Проверяем — нужно ли выплатить pending баллы
    // Выплата на 4-м месяце (Start → Stay)
    // Выплата на 7-м месяце (Stay → Belong)
    // Выплата на 10-м месяце (Belong → Belong+)
    const shouldPayout = newMonths === 4 || newMonths === 7 || newMonths === 10;

    if (shouldPayout && sub.pendingPoints > 0) {
      const pending = sub.pendingPoints;

      // Найти или создать кошелёк
      const wallet = await prisma.wallet.upsert({
        where:  { shop_customer: { shop, customerId } },
        create: { shop, customerId, balance: pending, totalSpent: 0, tier: newTier },
        update: { balance: { increment: pending }, tier: newTier },
      });

      // Записать транзакцию
      const walletRecord = await prisma.wallet.findUnique({
        where: { shop_customer: { shop, customerId } },
      });

      if (walletRecord) {
        await prisma.pointsTransaction.create({
          data: {
            walletId:    walletRecord.id,
            shop,
            customerId,
            orderId:     `payout-month-${newMonths}`,
            type:        "cashback",
            amount:      pending,
            description: `Выплата накопленных баллов при переходе на тир ${newTier} (месяц ${newMonths})`,
          },
        });
      }

      // Сбросить pending
      await prisma.subscription.update({
        where: { id: sub.id },
        data:  { pendingPoints: 0 },
      });

      console.log(`[billing] ✅ Payout ${pending} pts for ${customerId} at month ${newMonths} (${newTier})`);
    } else {
      // Просто обновить тир в кошельке
      await prisma.wallet.upsert({
        where:  { shop_customer: { shop, customerId } },
        create: { shop, customerId, balance: 0, totalSpent: 0, tier: newTier },
        update: { tier: newTier },
      });
      console.log(`[billing] Month ${newMonths}, tier ${newTier}, no payout`);
    }

    return new Response("OK", { status: 200 });

  } catch (e: any) {
    console.error("[billing] Error:", e.message);
    return new Response("Error", { status: 500 });
  }
}
