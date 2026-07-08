import prisma from "../db.server";

export const action = async ({ request }: any) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body       = await request.json();
    const shop       = request.headers.get("x-shopify-shop-domain") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
    const customerId = body.customer?.id?.toString();
    const orderId    = String(body.id);
    const orderName  = body.name || "";
    const totalPrice = parseFloat(body.total_price || "0");

    let orderProductNames = "";
    let orderFirstHandle  = "";
    try {
      if (Array.isArray(body.line_items) && body.line_items.length > 0) {
        orderProductNames = body.line_items
          .map((li: any) => li.title || li.name || "")
          .filter(Boolean)
          .join(", ");
        orderFirstHandle = body.line_items[0]?.handle || "";
      }
    } catch (e) {}

    if (!customerId || totalPrice <= 0) {
      return new Response("OK");
    }

    const existingTx = await prisma.pointsTransaction.findFirst({
      where: { orderId, type: { in: ["cashback", "cashback_pending"] } },
    });
    if (existingTx) {
      console.log("⚠️ Already processed order:", orderId);
      return new Response("Already processed");
    }

    // ── Списание баллов Wallet при использовании WALLET- кода ────────────────
    const discountCodes: any[] = body.discount_codes || [];
    const walletDiscount = discountCodes.find((d: any) =>
      d.code && d.code.startsWith("WALLET-")
    );

    if (walletDiscount) {
      const walletCode = walletDiscount.code;

      const discountRecord = await prisma.discount.findUnique({
        where: { code: walletCode },
      });

      if (discountRecord && !discountRecord.used) {
        const toRedeem   = discountRecord.amount;
        const walletCust = discountRecord.customerId;

        const w = await prisma.wallet.findFirst({
          where: { customerId: walletCust },
        });

        if (w) {
          await prisma.wallet.update({
            where: { id: w.id },
            data:  { balance: { decrement: toRedeem } },
          });

          await prisma.pointsTransaction.create({
            data: {
              walletId:    w.id,
              shop:        w.shop,
              customerId:  walletCust,
              orderId,
              type:        "redeemed",
              amount:      -toRedeem,
              // ← берём описание с товарами и handle из сохранённой записи
              description: discountRecord.note ||
                (orderProductNames
                  ? `Redeemed ${toRedeem} pts · ${orderProductNames}` + (orderFirstHandle ? ` ||${orderFirstHandle}` : "")
                  : `Redeemed ${toRedeem} pts for order ${orderName}`),
            },
          });

          await prisma.discount.update({
            where: { code: walletCode },
            data:  { used: true },
          });

          console.log(`💳 Wallet ${toRedeem} pts deducted for ${walletCust} (code ${walletCode})`);
        } else {
          console.log(`⚠️ Wallet not found for ${walletCust}`);
        }
      }
    }

    // Найти подписку
    const sub = await prisma.subscription.findFirst({
      where: { shop, customerId },
    });

    if (!sub || sub.status !== "active") {
      console.log(`[orders/create] No active subscription for ${customerId}`);
      return new Response("OK");
    }

    // Найти или создать кошелёк
    await prisma.wallet.upsert({
      where:  { shop_customer: { shop, customerId } },
      create: { shop, customerId, balance: 0, totalSpent: totalPrice, tier: sub.currentTier },
      update: { tier: sub.currentTier, totalSpent: { increment: totalPrice } },
    });

    const wallet = await prisma.wallet.findUnique({
      where: { shop_customer: { shop, customerId } },
    });

    if (!wallet) return new Response("OK");

    // ── Тиры и кэшбэк ────────────────────────────────────────────────────────
    const months = sub.monthsActive;
    let rate    = 0.10;
    let pending = true;

    if (months >= 4)  { rate = 0.15; pending = false; }
    if (months >= 7)  { rate = 0.20; pending = false; }
    if (months >= 10) { rate = 0.20; pending = false; }

    const cashback = Math.round(totalPrice * rate);

    if (cashback > 0) {
      if (pending) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data:  { pendingPoints: { increment: cashback }, lastOrderAt: new Date() },
        });
        await prisma.pointsTransaction.create({
          data: {
            walletId:    wallet.id,
            shop,
            customerId,
            orderId,
            type:        "cashback_pending",
            amount:      cashback,
            description: orderProductNames
              ? `Cashback 10% · ${orderProductNames} (pending until month 4)` + (orderFirstHandle ? ` ||${orderFirstHandle}` : "")
              : `Cashback 10% for order ${orderName} (pending until month 4)`,
          },
        });
        console.log(`⏳ Pending cashback +${cashback} for ${customerId} (month ${months})`);
      } else {
        await prisma.wallet.update({
          where: { shop_customer: { shop, customerId } },
          data:  { balance: { increment: cashback } },
        });
        await prisma.subscription.update({
          where: { id: sub.id },
          data:  { lastOrderAt: new Date() },
        });
        await prisma.pointsTransaction.create({
          data: {
            walletId:    wallet.id,
            shop,
            customerId,
            orderId,
            type:        "cashback",
            amount:      cashback,
            description: orderProductNames
              ? `Cashback ${Math.round(rate * 100)}% · ${orderProductNames}` + (orderFirstHandle ? ` ||${orderFirstHandle}` : "")
              : `Cashback ${Math.round(rate * 100)}% for order ${orderName}`,
          },
        });
        console.log(`✅ Cashback +${cashback} (${Math.round(rate * 100)}%) for ${customerId} (month ${months})`);
      }
    }

    // ── Реферальные баллы ─────────────────────────────────────────────────────
    const referral = await prisma.referral.findFirst({
      where: { shop, refereeId: customerId },
    });

    if (referral) {
      const REFERRAL_EXPIRY_DAYS = 30;
      const appliedAt = referral.appliedAt;

      if (!appliedAt) {
        console.log(`⚠️ Referral has no appliedAt for ${customerId}, skipping`);
      } else {
        const daysSinceApplied =
          (Date.now() - new Date(appliedAt).getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceApplied > REFERRAL_EXPIRY_DAYS) {
          console.log(`⏰ Referral expired for ${customerId}: ${Math.round(daysSinceApplied)} days since applied (max ${REFERRAL_EXPIRY_DAYS})`);
        } else {
          const referrerWallet = await prisma.wallet.findFirst({
            where: { shop, customerId: referral.referrerId },
          });

          if (referrerWallet) {
            const isFirstOrder = referral.status === "pending";
            const bonusRate    = isFirstOrder ? 0.15 : 0.05;
            const bonus        = Math.round(totalPrice * bonusRate);

            if (bonus > 0) {
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
                  description: orderProductNames
                    ? `Referral ${Math.round(bonusRate * 100)}% — friend order: ${orderProductNames}` +
                      (orderFirstHandle ? ` ||${orderFirstHandle}` : "")
                    : `Referral ${Math.round(bonusRate * 100)}% — friend order ${orderName}`,
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
              console.log(`🎁 Referral bonus +${bonus} (${Math.round(bonusRate * 100)}%) to ${referral.referrerId} [day ${Math.round(daysSinceApplied)}/${REFERRAL_EXPIRY_DAYS}]`);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error);
    return new Response("Error", { status: 500 });
  }
};
