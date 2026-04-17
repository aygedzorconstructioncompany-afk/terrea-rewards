import prisma from "../db.server";

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== "terrea-admin-2024") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const now = new Date();
    const results: any[] = [];

    const subscriptions = await prisma.subscription.findMany({
      where: { status: "active" },
    });

    console.log(`[cron] Processing ${subscriptions.length} active subscriptions`);

    for (const sub of subscriptions) {
      try {
        const startedAt = new Date(sub.startedAt);
        const diffMs = now.getTime() - startedAt.getTime();
        const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
        const monthsActive = Math.max(1, diffMonths);

        const currentTier = monthsActive >= 10 ? "belong+"
          : monthsActive >= 7 ? "belong"
          : monthsActive >= 4 ? "stay"
          : "start";

        const prevMonths = sub.monthsActive;
        const prevTier = sub.currentTier;

        const wasStart = prevMonths < 4;
        const isNowStay = monthsActive >= 4;
        const shouldTransferPending = wasStart && isNowStay && sub.pendingPoints > 0;

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            monthsActive,
            currentTier,
            pendingPoints: shouldTransferPending ? 0 : sub.pendingPoints,
          },
        });

        if (shouldTransferPending) {
          const wallet = await prisma.wallet.findUnique({
            where: { shop_customer: { shop: sub.shop, customerId: sub.customerId } },
          });

          if (wallet) {
            await prisma.wallet.update({
              where: { shop_customer: { shop: sub.shop, customerId: sub.customerId } },
              data: { balance: { increment: sub.pendingPoints }, tier: currentTier },
            });

            await prisma.pointsTransaction.create({
              data: {
                walletId:    wallet.id,
                shop:        sub.shop,
                customerId:  sub.customerId,
                type:        "cashback",
                amount:      sub.pendingPoints,
                description: `Pending баллы зачислены — достигнут тир ${currentTier} (${monthsActive} мес)`,
              },
            });

            console.log(`[cron] ✅ Transferred ${sub.pendingPoints} pending pts for ${sub.customerId}`);
          }
        }

        await prisma.wallet.upsert({
          where: { shop_customer: { shop: sub.shop, customerId: sub.customerId } },
          create: { shop: sub.shop, customerId: sub.customerId, balance: 0, totalSpent: 0, tier: currentTier },
          update: { tier: currentTier },
        });

        results.push({
          customerId:  sub.customerId,
          prevMonths,
          newMonths:   monthsActive,
          prevTier,
          newTier:     currentTier,
          transferred: shouldTransferPending ? sub.pendingPoints : 0,
        });

        console.log(`[cron] ${sub.customerId}: ${prevMonths}→${monthsActive} мес, ${prevTier}→${currentTier}`);

      } catch (e: any) {
        console.error(`[cron] Error for ${sub.customerId}:`, e.message);
        results.push({ customerId: sub.customerId, error: e.message });
      }
    }

    return new Response(JSON.stringify({
      success:   true,
      processed: results.length,
      timestamp: now.toISOString(),
      results,
    }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
