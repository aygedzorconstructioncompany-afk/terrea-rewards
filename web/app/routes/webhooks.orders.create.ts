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
          console.log(`⚠️ Subscription reset for ${customerId}`);
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

    // ================================
    // 💰 НАЧИСЛЕНИЕ БАЛЛОВ по ТЗ Ольги
    // Мес 1-3 → 10% копятся → начисляются в мес 4
    // Мес 4-6 → 15% копятся → начисляются в мес 7
    // Мес 7-9 → 20% копятся → начисляются в мес 10
    // Мес 10+ → 20% начисляются сразу
    // ================================
    let earnedPoints = 0;
    let pointsDescription = "";

    if (sub.monthsActive <= 3) {
      // Мес 1-3 — копятся 10%
      const pending = Math.floor(subtotalPrice * 0.10);
      const newPending = sub.pendingPoints + pending;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { pendingPoints: newPending },
      });
      await prisma.pointsTransaction.create({
        data: {
          walletId: wallet.id, shop, customerId, orderId,
          type: "earn_pending", amount: pending,
          description: `Month ${sub.monthsActive}/3 — pending (10%): +${pending} pts`,
          expiresAt,
        },
      });
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { totalSpent: { increment: totalPrice } },
      });
      console.log(`⏳ Pending +${pending} (month ${sub.monthsActive}/3)`);

    } else if (sub.monthsActive === 4) {
      // Мес 4 — начисляем все pending за 1-3, копим 15%
      const pending = sub.pendingPoints;
      earnedPoints = pending;
      pointsDescription = `Months 1-3 reward! +${pending} pts (10%)`;
      const newPending = Math.floor(subtotalPrice * 0.15);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { pendingPoints: newPending },
      });
      await prisma.pointsTransaction.create({
        data: {
          walletId: wallet.id, shop, customerId, orderId,
          type: "earn_pending", amount: newPending,
          description: `Month 4/6 — pending (15%): +${newPending} pts`,
          expiresAt,
        },
      });
      console.log(`⏳ Pending +${newPending} (month 4/6)`);

    } else if (sub.monthsActive >= 5 && sub.monthsActive <= 6) {
      // Мес 5-6 — копятся 15%
      const pending = Math.floor(subtotalPrice * 0.15);
      const newPending = sub.pendingPoints + pending;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { pendingPoints: newPending },
      });
      await prisma.pointsTransaction.create({
        data: {
          walletId: wallet.id, shop, customerId, orderId,
          type: "earn_pending", amount: pending,
          description: `Month ${sub.monthsActive}/6 — pending (15%): +${pending} pts`,
          expiresAt,
        },
      });
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { totalSpent: { increment: totalPrice } },
      });
      console.log(`⏳ Pending +${pending} (month ${sub.monthsActive}/6)`);

    } else if (sub.monthsActive === 7) {
      // Мес 7 — начисляем все pending за 4-6, копим 20%
      const pending = sub.pendingPoints;
      earnedPoints = pending;
      pointsDescription = `Months 4-6 reward! +${pending} pts (15%)`;
      const newPending = Math.floor(subtotalPrice * 0.20);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { pendingPoints: newPending },
      });
      await prisma.pointsTransaction.create({
        data: {
          walletId: wallet.id, shop, customerId, orderId,
          type: "earn_pending", amount: newPending,
          description: `Month 7/9 — pending (20%): +${newPending} pts`,
          expiresAt,
        },
      });
      console.log(`⏳ Pending +${newPending} (month 7/9)`);

    } else if (sub.monthsActive >= 8 && sub.monthsActive <= 9) {
      // Мес 8-9 — копятся 20%
      const pending = Math.floor(subtotalPrice * 0.20);
      const newPending = sub.pendingPoints + pending;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { pendingPoints: newPending },
      });
      await prisma.pointsTransaction.create({
        data: {
          walletId: wallet.id, shop, customerId, orderId,
          type: "earn_pending", amount: pending,
          description: `Month ${sub.monthsActive}/9 — pending (20%): +${pending} pts`,
          expiresAt,
        },
      });
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { totalSpent: { increment: totalPrice } },
      });
      console.log(`⏳ Pending +${pending} (month ${sub.monthsActive}/9)`);

    } else if (sub.monthsActive === 10) {
      // Мес 10 — начисляем все pending за 7-9 + сразу 20%
      const pending = sub.pendingPoints;
      const currentBonus = Math.floor(subtotalPrice * 0.20);
      earnedPoints = pending + currentBonus;
      pointsDescription = `Months 7-9 reward! +${pending} pts + 20% bonus +${currentBonus} pts`;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { pendingPoints: 0 },
      });

    } else {
      // Мес 10+ — сразу 20%
      earnedPoints = Math.floor(subtotalPrice * 0.20);
      pointsDescription = `Gold tier — 20%: +${earnedPoints} pts`;
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
            walletId: wallet.id, shop, customerId, orderId,
            type: "earn", amount: earnedPoints,
            description: pointsDescription || "Order reward",
            expiresAt,
          },
        }),
      ]);
      console.log(`✅ Points added: +${earnedPoints} for ${customerId}`);
    }

    // ================================
    // 🎁 РЕФЕРАЛЬНАЯ СИСТЕМА
    // ================================
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
              walletId: referrerWallet.id, shop,
              customerId: referrerWallet.customerId,
              orderId, type: "referral", amount: referralBonus,
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