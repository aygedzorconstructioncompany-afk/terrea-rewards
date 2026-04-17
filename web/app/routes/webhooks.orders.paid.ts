import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

// ─── Тиры ────────────────────────────────────────────────────────────────────
function getCashbackRate(monthsActive: number): number {
  if (monthsActive >= 10) return 0.20; // Belong+
  if (monthsActive >= 7)  return 0.20; // Belong
  if (monthsActive >= 4)  return 0.15; // Stay
  return 0.10;                          // Start (pending — не выплачивается сразу)
}

function isPending(monthsActive: number): boolean {
  return monthsActive < 4; // Start tier — баллы pending
}

// ─── Webhook handler ──────────────────────────────────────────────────────────
export async function action({ request }: ActionFunctionArgs) {
  const shop = request.headers.get("x-shopify-shop-domain") || "";
  
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const customerId = String(payload.customer?.id || "");
  const orderTotal  = parseFloat(payload.total_price || "0");   // сумма заказа
  const orderId     = String(payload.id || "");
  const orderName   = payload.name || "";                        // #1001 и т.д.

  console.log(`[orders/paid] shop=${shop} customer=${customerId} order=${orderName} total=${orderTotal}`);

  if (!customerId || !shop || orderTotal <= 0) {
    return new Response("OK", { status: 200 });
  }

  try {
    // 1. Найти подписку покупателя
    const sub = await prisma.subscription.findFirst({
      where: { shop, customerId },
    });

    if (!sub || sub.status !== "active") {
      console.log(`[orders/paid] No active subscription for ${customerId}`);
      return new Response("OK", { status: 200 });
    }

    // 2. Найти или создать кошелёк
    const wallet = await prisma.wallet.upsert({
      where: { shop_customer: { shop, customerId } },
      create: { shop, customerId, balance: 0, totalSpent: 0, tier: sub.currentTier },
      update: { tier: sub.currentTier, totalSpent: { increment: orderTotal } },
    });

    // 3. Посчитать кэшбэк
    const rate      = getCashbackRate(sub.monthsActive);
    const cashback  = Math.round(orderTotal * rate); // баллы (1 балл = 1£)
    const pending   = isPending(sub.monthsActive);

    // 4. Автосписание накопленного баланса (если есть и не pending)
    let redeemedBalance = 0;
    if (wallet.balance > 0 && !pending) {
      redeemedBalance = wallet.balance;

      // Применить скидку через Shopify Admin API
      await applyOrderDiscount(shop, orderId, redeemedBalance);

      // Записать транзакцию списания
      await prisma.pointsTransaction.create({
        data: {
          walletId:    wallet.id,
          shop,
          customerId,
          orderId,
          type:        "redeemed",
          amount:      -redeemedBalance,
          description: `Автосписание кэшбэка за заказ ${orderName}`,
        },
      });
    }

    // 5. Начислить новый кэшбэк
    if (cashback > 0) {
      await prisma.wallet.update({
        where: { shop_customer: { shop, customerId } },
        data:  { balance: { increment: pending ? 0 : cashback - redeemedBalance < 0 ? 0 : cashback } },
      });

      // Если pending — записываем в pendingPoints подписки
      if (pending) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data:  { pendingPoints: { increment: cashback }, lastOrderAt: new Date() },
        });
      } else {
        await prisma.subscription.update({
          where: { id: sub.id },
          data:  { lastOrderAt: new Date() },
        });
      }

      await prisma.pointsTransaction.create({
        data: {
          walletId:    wallet.id,
          shop,
          customerId,
          orderId,
          type:        pending ? "cashback_pending" : "cashback",
          amount:      cashback,
          description: `Кэшбэк ${Math.round(rate * 100)}% за заказ ${orderName}${pending ? " (pending до 4 мес)" : ""}`,
        },
      });
    }

    // 6. Реферальные баллы
    await processReferralBonus(shop, customerId, orderId, orderName, orderTotal, wallet.id);

    console.log(`[orders/paid] ✅ cashback=${cashback} pending=${pending} redeemed=${redeemedBalance}`);
    return new Response("OK", { status: 200 });

  } catch (e: any) {
    console.error("[orders/paid] Error:", e.message);
    return new Response("Error", { status: 500 });
  }
}

// ─── Применить скидку через Shopify Admin API ─────────────────────────────────
async function applyOrderDiscount(shop: string, orderId: string, amount: number) {
  try {
    // Получаем access token из сессии
    const session = await prisma.session.findFirst({
      where: { shop, isOnline: false },
    });

    if (!session?.accessToken) {
      console.error("[applyOrderDiscount] No session/accessToken found");
      return;
    }

    // Shopify Admin API — создать adjustment на заказе
    const response = await fetch(
      `https://${shop}/admin/api/2024-01/orders/${orderId}/adjustments.json`,
      {
        method: "POST",
        headers: {
          "Content-Type":         "application/json",
          "X-Shopify-Access-Token": session.accessToken,
        },
        body: JSON.stringify({
          order_adjustment: {
            kind:   "shipping_refund", // используем как discount adjustment
            reason: `Terrea Rewards кэшбэк — ${amount} pts`,
            amount: `-${amount}.00`,
            tax_amount: "0.00",
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[applyOrderDiscount] Shopify API error:", err);
    } else {
      console.log(`[applyOrderDiscount] ✅ Applied discount ${amount} to order ${orderId}`);
    }
  } catch (e: any) {
    console.error("[applyOrderDiscount] Exception:", e.message);
  }
}

// ─── Реферальные баллы ────────────────────────────────────────────────────────
async function processReferralBonus(
  shop: string,
  customerId: string,
  orderId: string,
  orderName: string,
  orderTotal: number,
  walletId: string
) {
  try {
    // Найти реферал где этот покупатель — referee
    const referral = await prisma.referral.findFirst({
      where: { shop, refereeId: customerId },
    });

    if (!referral) return;

    // Найти кошелёк реферрера
    const referrerWallet = await prisma.wallet.findFirst({
      where: { shop, customerId: referral.referrerId },
    });

    if (!referrerWallet) return;

    // Первый заказ → 15%, следующие → 5%
    const isFirstOrder = referral.status === "pending";
    const bonusRate    = isFirstOrder ? 0.15 : 0.05;
    const bonus        = Math.round(orderTotal * bonusRate);

    if (bonus <= 0) return;

    // Начислить бонус реферреру
    await prisma.wallet.update({
      where: { shop_customer: { shop, customerId: referral.referrerId } },
      data:  { balance: { increment: bonus } },
    });

    await prisma.pointsTransaction.create({
      data: {
        walletId:    referrerWallet.id,
        shop,
        customerId:  referral.referrerId,
        orderId,
        type:        "referral_bonus",
        amount:      bonus,
        description: `Реферальный бонус ${Math.round(bonusRate * 100)}% — заказ друга ${orderName}`,
      },
    });

    // Обновить статус реферала
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status:          isFirstOrder ? "active" : "active",
        refereeId:       customerId,
        firstOrderBonus: isFirstOrder ? bonus : referral.firstOrderBonus,
        totalBonus:      { increment: bonus },
        completedAt:     isFirstOrder ? new Date() : referral.completedAt,
      },
    });

    console.log(`[referral] ✅ bonus=${bonus} (${Math.round(bonusRate*100)}%) to referrer=${referral.referrerId}`);
  } catch (e: any) {
    console.error("[referral] Error:", e.message);
  }
}
