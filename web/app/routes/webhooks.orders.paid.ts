import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

function getCashbackRate(monthsActive: number): number {
  if (monthsActive >= 10) return 0.20;
  if (monthsActive >= 7)  return 0.20;
  if (monthsActive >= 4)  return 0.15;
  return 0.10;
}

function isPending(monthsActive: number): boolean {
  return monthsActive < 10;
}

function getPendingDescription(monthsActive: number, rate: number, orderName: string): string {
  if (monthsActive < 4)  return `Кэшбэк ${Math.round(rate*100)}% за заказ ${orderName} (pending, выплата на 4-м мес)`;
  if (monthsActive < 7)  return `Кэшбэк ${Math.round(rate*100)}% за заказ ${orderName} (pending, выплата на 7-м мес)`;
  return `Кэшбэк ${Math.round(rate*100)}% за заказ ${orderName} (pending, выплата на 10-м мес)`;
}

function getTier(monthsActive: number): string {
  if (monthsActive >= 10) return "belong+";
  if (monthsActive >= 7)  return "belong";
  if (monthsActive >= 4)  return "stay";
  return "start";
}

export async function action({ request }: ActionFunctionArgs) {
  const shop = request.headers.get("x-shopify-shop-domain") || "";

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const customerId = String(payload.customer?.id || "");
  const orderTotal = parseFloat(payload.total_price || "0");
  const orderId    = String(payload.id || "");
  const orderName  = payload.name || "";

  console.log(`[orders/paid] shop=${shop} customer=${customerId} order=${orderName} total=${orderTotal}`);

  if (!customerId || !shop || orderTotal <= 0) {
    return new Response("OK", { status: 200 });
  }

  try {
    const sub = await prisma.subscription.findFirst({
      where: { shop, customerId },
    });

    if (!sub || sub.status !== "active") {
      console.log(`[orders/paid] No active subscription for ${customerId}`);
      return new Response("OK", { status: 200 });
    }

    // Увеличиваем месяцы и обновляем тир
    const newMonthsActive = sub.monthsActive + 1;
    const newTier = getTier(newMonthsActive);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        monthsActive: newMonthsActive,
        currentTier: newTier,
        lastOrderAt: new Date(),
      },
    });

    console.log(`[orders/paid] 📅 monthsActive=${newMonthsActive} tier=${newTier} for ${customerId}`);

    // Найти или создать кошелёк
    await prisma.wallet.upsert({
      where:  { shop_customer: { shop, customerId } },
      create: { shop, customerId, balance: 0, totalSpent: orderTotal, tier: newTier },
      update: { tier: newTier, totalSpent: { increment: orderTotal } },
    });

    const wallet = await prisma.wallet.findUnique({
      where: { shop_customer: { shop, customerId } },
    });

    if (!wallet) return new Response("OK", { status: 200 });

    // Выплата накопленных pending баллов при достижении порога
    if (newMonthsActive === 4 || newMonthsActive === 7 || newMonthsActive === 10) {
      const pendingToRelease = sub.pendingPoints;
      if (pendingToRelease > 0) {
        await prisma.wallet.update({
          where: { shop_customer: { shop, customerId } },
          data: { balance: { increment: pendingToRelease } },
        });
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { pendingPoints: 0 },
        });
        await prisma.pointsTransaction.create({
          data: {
            walletId:    wallet.id,
            shop,
            customerId,
            orderId,
            type:        "cashback_released",
            amount:      pendingToRelease,
            description: `Выплата накопленного кэшбэка на ${newMonthsActive}-м месяце`,
          },
        });
        console.log(`[orders/paid] 💰 Released ${pendingToRelease} pending points for ${customerId} at month ${newMonthsActive}`);
      }
    }

    const rate     = getCashbackRate(newMonthsActive);
    const cashback = Math.round(orderTotal * rate);
    const pending  = isPending(newMonthsActive);

    if (cashback > 0) {
      if (pending) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data:  { pendingPoints: { increment: cashback } },
        });
        await prisma.pointsTransaction.create({
          data: {
            walletId:    wallet.id,
            shop,
            customerId,
            orderId,
            type:        "cashback_pending",
            amount:      cashback,
            description: getPendingDescription(newMonthsActive, rate, orderName),
          },
        });
        console.log(`[orders/paid] ⏳ Pending cashback=${cashback} for ${customerId} (month ${newMonthsActive})`);
      } else {
        // Belong+ (10+ мес) — начисляем сразу
        await prisma.wallet.update({
          where: { shop_customer: { shop, customerId } },
          data:  { balance: { increment: cashback } },
        });
        await prisma.pointsTransaction.create({
          data: {
            walletId:    wallet.id,
            shop,
            customerId,
            orderId,
            type:        "cashback",
            amount:      cashback,
            description: `Кэшбэк ${Math.round(rate * 100)}% за заказ ${orderName}`,
          },
        });
        console.log(`[orders/paid] ✅ Cashback=${cashback} (${Math.round(rate*100)}%) for ${customerId}`);
      }
    }

    // Реферальные баллы
    await processReferralBonus(shop, customerId, orderId, orderName, orderTotal, wallet.id);

    return new Response("OK", { status: 200 });

  } catch (e: any) {
    console.error("[orders/paid] Error:", e.message);
    return new Response("Error", { status: 500 });
  }
}

async function processReferralBonus(
  shop: string, customerId: string, orderId: string,
  orderName: string, orderTotal: number, walletId: string
) {
  try {
    const referral = await prisma.referral.findFirst({
      where: { shop, refereeId: customerId },
    });
    if (!referral) return;

    const referrerWallet = await prisma.wallet.findFirst({
      where: { shop, customerId: referral.referrerId },
    });
    if (!referrerWallet) return;

    const isFirstOrder = referral.status === "pending";
    const bonusRate    = isFirstOrder ? 0.15 : 0.05;
    const bonus        = Math.round(orderTotal * bonusRate);
    if (bonus <= 0) return;

    await prisma.wallet.update({
      where: { shop_customer: { shop, customerId: referral.referrerId } },
      data:  { balance: { increment: bonus } },
    });
    await prisma.pointsTransaction.create({
      data: {
        walletId:   referrerWallet.id,
        shop,
        customerId: referral.referrerId,
        orderId,
        type:       "referral_bonus",
        amount:     bonus,
        description: `Реферал ${Math.round(bonusRate * 100)}% — заказ друга ${orderName}`,
      },
    });
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status:          "active",
        firstOrderBonus: isFirstOrder ? bonus : referral.firstOrderBonus,
        totalBonus:      { increment: bonus },
        completedAt:     isFirstOrder ? new Date() : referral.completedAt,
      },
    });
    console.log(`[referral] ✅ bonus=${bonus} to referrer=${referral.referrerId}`);
  } catch (e: any) {
    console.error("[referral] Error:", e.message);
  }
}
