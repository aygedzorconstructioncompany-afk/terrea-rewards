import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

function getCashbackRate(monthsActive: number): number {
  if (monthsActive >= 10) return 0.20;
  if (monthsActive >= 7) return 0.20;
  if (monthsActive >= 4) return 0.15;
  return 0.10;
} 

function getPendingDescription(monthsActive: number, rate: number, orderName: string): string {
  if (monthsActive < 4) return `Cashback ${Math.round(rate * 100)}% for order ${orderName} (pending, paid on month 4)`;
  if (monthsActive < 7) return `Cashback ${Math.round(rate * 100)}% for order ${orderName} (pending, paid on month 7)`;
  return `Cashback ${Math.round(rate * 100)}% for order ${orderName} (pending, paid on month 10)`;
}

function getTier(monthsActive: number): string {
  if (monthsActive >= 10) return "belong+";
  if (monthsActive >= 7) return "belong";
  if (monthsActive >= 4) return "stay";
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
  const orderTotal = parseFloat(payload.subtotal_price || "0");
  const orderId = String(payload.id || "");
  const orderName = payload.name || "";
  const tags = (payload.tags || "").toLowerCase();
  const sourceName = (payload.source_name || "").toLowerCase();
  const customerEmail = payload.customer?.email || payload.email || "";

  // ✅ Определяем тип заказа
  const isSubscription =
    tags.includes("subscription") ||
    sourceName === "subscription_contract" ||
    sourceName === "recharge";

  if (!customerId || !shop || orderTotal <= 0) {
    return new Response("OK", { status: 200 });
  }

  const MAIN_SHOP = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

  console.log(`[orders/paid] shop=${shop} customer=${customerId} order=${orderName} total=${orderTotal} subscription=${isSubscription}`);

  try {
    // =========================
    // DUPLICATE PROTECTION
    // =========================
    const existingOrder = await prisma.pointsTransaction.findFirst({
      where: {
        orderId,
        type: { in: ["cashback", "cashback_pending", "cashback_released", "referral_bonus"] },
      },
    });

    if (existingOrder) {
      console.log(`[orders/paid] ⚠️ Already processed order: ${orderName}`);
      return new Response("OK", { status: 200 });
    }

    // =========================
    // ОБЫЧНЫЙ ЗАКАЗ — только рефералы, без кэшбэка
    // =========================
    if (!isSubscription) {
      console.log(`[orders/paid] 📦 Regular order ${orderName} — referral bonus only`);

      // Находим wallet для referral bonus
      const wallet = await prisma.wallet.findUnique({
        where: { shop_customer: { shop: MAIN_SHOP, customerId } },
      });

      if (wallet) {
        await processReferralBonus(MAIN_SHOP, customerId, orderId, orderName, orderTotal, wallet.id);
      }

      return new Response("OK", { status: 200 });
    }

    // =========================
    // ПОДПИСКА — кэшбэк + рефералы
    // =========================
    console.log(`[orders/paid] 🔄 Subscription order ${orderName} — cashback + referral`);

    let sub = await prisma.subscription.findFirst({
      where: { shop: MAIN_SHOP, customerId },
    });

    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          shop: MAIN_SHOP,
          customerId,
          status: "active",
          monthsActive: 0,
          currentTier: "start",
          pendingPoints: 0,
        },
      });
      console.log(`[orders/paid] ✅ Auto-created subscription for ${customerId}`);
    }

    const newMonthsActive = sub.monthsActive + 1;
    const newTier = getTier(newMonthsActive);

    const updatedSub = await prisma.subscription.updateMany({
      where: { id: sub.id, monthsActive: sub.monthsActive },
      data: {
        monthsActive: sub.monthsActive + 1,
        currentTier: getTier(sub.monthsActive + 1),
        lastOrderAt: new Date(),
      },
    });

    if (updatedSub.count === 0) {
      console.log(`[orders/paid] ⚠️ Race condition detected for ${customerId}`);
      return new Response("OK", { status: 200 });
    }

    console.log(`[orders/paid] 📅 monthsActive=${newMonthsActive} tier=${newTier} for ${customerId}`);

    await prisma.wallet.upsert({
      where: { shop_customer: { shop: MAIN_SHOP, customerId } },
      create: {
        shop: MAIN_SHOP,
        customerId,
        email: customerEmail,
        balance: 0,
        totalSpent: orderTotal,
        tier: newTier,
      },
      update: {
        tier: newTier,
        totalSpent: { increment: orderTotal },
        ...(customerEmail ? { email: customerEmail } : {}),
      },
    });

    const wallet = await prisma.wallet.findUnique({
      where: { shop_customer: { shop: MAIN_SHOP, customerId } },
    });

    if (!wallet) return new Response("OK", { status: 200 });

    // =========================
    // RELEASE PENDING
    // =========================
    if (newMonthsActive === 4 || newMonthsActive === 7 || newMonthsActive === 10) {
      const pendingToRelease = sub.pendingPoints;
      if (pendingToRelease > 0) {
        await prisma.wallet.update({
          where: { shop_customer: { shop: MAIN_SHOP, customerId } },
          data: { balance: { increment: pendingToRelease } },
        });
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { pendingPoints: 0 },
        });
        try {
          await prisma.pointsTransaction.create({
            data: {
              walletId: wallet.id,
              shop: MAIN_SHOP,
              customerId,
              orderId,
              type: "cashback_released",
              amount: pendingToRelease,
              description: `Cashback released at month ${newMonthsActive}`,
            },
          });
        } catch {
          console.log("[cashback_release] duplicate prevented");
        }
        console.log(`[orders/paid] 💰 Released ${pendingToRelease} pending points`);
      }
    }

    // =========================
    // CASHBACK
    // =========================
    const rate = getCashbackRate(newMonthsActive);
    const cashback = Math.round(orderTotal * rate);
    const pending =
      newMonthsActive < 4 ||
      (newMonthsActive > 4 && newMonthsActive < 7) ||
      (newMonthsActive > 7 && newMonthsActive < 10);

    if (cashback > 0) {
      if (pending) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { pendingPoints: { increment: cashback } },
        });
        try {
          await prisma.pointsTransaction.create({
            data: {
              walletId: wallet.id,
              shop: MAIN_SHOP,
              customerId,
              orderId,
              type: "cashback_pending",
              amount: cashback,
              description: getPendingDescription(newMonthsActive, rate, orderName),
            },
          });
        } catch {
          console.log("[cashback_pending] duplicate prevented");
        }
        console.log(`[orders/paid] ⏳ Pending cashback=${cashback}`);
      } else {
        await prisma.wallet.update({
          where: { shop_customer: { shop: MAIN_SHOP, customerId } },
          data: { balance: { increment: cashback } },
        });
        try {
          await prisma.pointsTransaction.create({
            data: {
              walletId: wallet.id,
              shop: MAIN_SHOP,
              customerId,
              orderId,
              type: "cashback",
              amount: cashback,
              description: `Cashback ${Math.round(rate * 100)}% for order ${orderName}`,
            },
          });
        } catch {
          console.log("[cashback] duplicate prevented");
        }
        console.log(`[orders/paid] ✅ Cashback=${cashback}`);
      }
    }

    // =========================
    // REFERRAL BONUS
    // =========================
    await processReferralBonus(MAIN_SHOP, customerId, orderId, orderName, orderTotal, wallet.id);

    return new Response("OK", { status: 200 });

  } catch (e: any) {
    console.error("[orders/paid] Error:", e.message);
    return new Response("Error", { status: 500 });
  }
}

async function processReferralBonus(shop: string, customerId: string, orderId: string, orderName: string, orderTotal: number, walletId: string) {
  try {
    const referral = await prisma.referral.findFirst({ where: { refereeId: customerId } });
    if (!referral) { console.log(`[referral] ❌ No referral found for ${customerId}`); return; }

    const referrerWallet = await prisma.wallet.findFirst({ where: { customerId: referral.referrerId } });
    if (!referrerWallet) { console.log(`[referral] ❌ No wallet for referrer=${referral.referrerId}`); return; }

    const existingReferral = await prisma.pointsTransaction.findFirst({ where: { orderId, type: "referral_bonus" } });
    if (existingReferral) { console.log(`[referral] ⚠️ Duplicate prevented for ${orderName}`); return; }

    const isFirstOrder = referral.status === "pending";
    const bonusRate = isFirstOrder ? 0.15 : 0.05;
    const bonus = Math.round(orderTotal * bonusRate);
    if (bonus <= 0) return;

    await prisma.wallet.update({
      where: { shop_customer: { shop, customerId: referral.referrerId } },
      data: { balance: { increment: bonus } },
    });

    await prisma.pointsTransaction.create({
      data: {
        walletId: referrerWallet.id,
        shop,
        customerId: referral.referrerId,
        orderId,
        type: "referral_bonus",
        amount: bonus,
        description: `Referral ${Math.round(bonusRate * 100)}% — friend's order ${orderName}`,
      },
    });

    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: "active",
        firstOrderBonus: isFirstOrder ? bonus : referral.firstOrderBonus,
        totalBonus: { increment: bonus },
        completedAt: isFirstOrder ? new Date() : referral.completedAt,
      },
    });

    console.log(`[referral] ✅ bonus=${bonus} to referrer=${referral.referrerId}`);
  } catch (e: any) {
    console.error("[referral] Error:", e.message);
  }
}
