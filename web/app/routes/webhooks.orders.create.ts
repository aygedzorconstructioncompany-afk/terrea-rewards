import prisma from "../db.server";

const SIX_MONTHS = 6 * 30 * 24 * 60 * 60 * 1000;

export const action = async ({ request }: any) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body = await request.json();

    const shop = "terrea-dev-store.myshopify.com";
    const customerId = body.customer?.id?.toString();
    const orderId = String(body.id);
    const totalPrice = parseFloat(body.total_price || "0");
    const subtotalPrice = parseFloat(body.subtotal_price || body.total_price || "0");

    if (!customerId) {
      return new Response("OK");
    }

    const existingTx = await prisma.pointsTransaction.findFirst({
      where: { orderId, type: "earn" },
    });

    if (existingTx) {
      console.log("⚠️ Already processed order:", orderId);
      return new Response("Already processed");
    }

    let wallet = await prisma.wallet.findFirst({
      where: { customerId, shop },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { shop, customerId, balance: 0, totalSpent: 0 },
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SIX_MONTHS);
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let sub = await prisma.subscription.findFirst({
      where: { shop, customerId },
    });

    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          shop,
          customerId,
          status: "active",
          monthsActive: 1,
          currentTier: "bronze",
          pendingPoints: 0,
          lastOrderAt: now,
          lastBillingMonth: currentMonth,
        },
      });
    } else {
      const lastMonth = sub.lastBillingMonth;
      let monthsActive = sub.monthsActive;
      let pendingPoints = sub.pendingPoints;

      if (lastMonth && lastMonth !== currentMonth) {
        const [lastY, lastM] = lastMonth.split("-").map(Number);
        const [curY, curM] = currentMonth.split("-").map(Number);
        const monthDiff = (curY - lastY) * 12 + (curM - lastM);

        if (monthDiff > 1) {
          console.log(`⚠️ Subscription reset for ${customerId} — skipped ${monthDiff - 1} month(s)`);
          monthsActive = 1;
          pendingPoints = 0;
        } else {
          monthsActive += 1;
        }
      }

      let currentTier = "bronze";
      if (monthsActive >= 7) currentTier = "gold";
      else if (monthsActive >= 4) currentTier = "silver";

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          monthsActive,
          currentTier,
          pendingPoints,
          lastOrderAt: now,
          lastBillingMonth: currentMonth,
          status: "active",
        },
      });

      sub = { ...sub, monthsActive, currentTier, pendingPoints };
    }

    let earnedPoints = 0;
    let pointsDescription = "";

    if (sub.monthsActive <= 3) {
      const pending = Math.floor(subtotalPrice * 0.10);
      const newPending = sub.pendingPoints + pending;

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { pendingPoints: newPending },
      });

      await prisma.pointsTransaction.create({
        data: {
          walletId: wallet.id,
          shop,
          customerId,
          orderId,
          type: "earn_pending",
          amount: pending,
          description: `Month ${sub.monthsActive}/3 — points pending (10%): +${pending} pts`,
          expiresAt,
        },
      });

      console.log(`⏳ Pending points +${pending} (month ${sub.monthsActive}/3) for ${customerId}`);

    } else if (sub.monthsActive === 4) {
      const pending = sub.pendingPoints;
      const currentBonus = Math.floor(subtotalPrice * 0.15);
      earnedPoints = pending + currentBonus;
      pointsDescription = `Silver tier unlocked! Pending pts +${pending} + 15% bonus +${currentBonus}`;

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { pendingPoints: 0 },
      });

    } else if (sub.monthsActive >= 5 && sub.monthsActive <= 6) {
      earnedPoints = Math.floor(subtotalPrice * 0.15);
      pointsDescription = `Silver tier — 15% reward: +${earnedPoints} pts`;

    } else {
      earnedPoints = Math.floor(subtotalPrice * 0.20);
      pointsDescription = `Gold tier — 20% reward: +${earnedPoints} pts`;
    }

    if (earnedPoints > 0) {
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: earnedPoints },
            totalSpent: { increment: totalPrice },
          },
        }),
        prisma.pointsTransaction.create({
          data: {
            walletId: wallet.id,
            shop,
            customerId,
            orderId,
            type: "earn",
            amount: earnedPoints,
            description: pointsDescription || "Order reward",
            expiresAt,
          },
        }),
      ]);

      console.log(`✅ Points added: +${earnedPoints} for ${customerId} (${sub.currentTier})`);
    } else if (sub.monthsActive <= 3) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { totalSpent: { increment: totalPrice } },
      });
    }

    if (wallet.referredBy) {
      const referrerWallet = await prisma.wallet.findFirst({
        where: { customerId: wallet.referredBy, shop },
      });

      if (referrerWallet) {
        const previousOrders = await prisma.pointsTransaction.count({
          where: {
            customerId,
            type: { in: ["earn", "earn_pending"] },
            orderId: { not: orderId },
          },
        });

        const isFirstOrder = previousOrders === 0;
        const percent = isFirstOrder ? 0.15 : 0.05;
        const referralBonus = Math.ceil(subtotalPrice * percent);

        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: referrerWallet.id },
            data: { balance: { increment: referralBonus } },
          }),
          prisma.pointsTransaction.create({
            data: {
              walletId: referrerWallet.id,
              shop,
              customerId: referrerWallet.customerId,
              orderId,
              type: "referral",
              amount: referralBonus,
              description: isFirstOrder
                ? `Referral bonus 15% from first order of ${customerId}`
                : `Referral bonus 5% from order of ${customerId}`,
              expiresAt,
            },
          }),
          prisma.referral.updateMany({
            where: {
              referrerId: referrerWallet.customerId,
              refereeId: customerId,
            },
            data: {
              status: isFirstOrder ? "completed" : "active",
              firstOrderBonus: isFirstOrder ? referralBonus : undefined,
              totalBonus: { increment: referralBonus },
              completedAt: isFirstOrder ? new Date() : undefined,
            },
          }),
        ]);

        console.log(`🎁 Referral bonus +${referralBonus} to ${referrerWallet.customerId}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error);
    return new Response("Error", { status: 500 });
  }
};