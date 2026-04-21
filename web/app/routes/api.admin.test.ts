import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  const months = parseInt(url.searchParams.get("months") || "0");
  const secret = url.searchParams.get("secret");

  if (secret !== "terrea-admin-2024") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (!customerId || !months) {
    return new Response(JSON.stringify({ error: "customer_id and months required" }), { status: 400 });
  }

  const date = new Date();
  date.setMonth(date.getMonth() - months);

  const currentTier = months >= 10 ? "belong+" : months >= 7 ? "belong" : months >= 4 ? "stay" : "start";
  const shop = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

  try {
    // Найти существующую подписку
    const existing = await prisma.subscription.findFirst({
      where: { shop, customerId },
    });

    const pendingToTransfer = (months >= 4 && existing?.pendingPoints) ? existing.pendingPoints : 0;

    // Обновить подписку
    const sub = await prisma.subscription.upsert({
      where: { shop_customerId: { customerId, shop } },
      create: {
        customerId,
        shop,
        startedAt: date,
        monthsActive: months,
        status: "active",
        currentTier,
        pendingPoints: 0,
      },
      update: {
        startedAt: date,
        monthsActive: months,
        status: "active",
        currentTier,
        // Сбрасываем pending если переходим на 4+ мес
       pendingPoints: 0,
      }
    });

    // Перенести pendingPoints на баланс при переходе на 4+ мес
    if (pendingToTransfer > 0) {
      await prisma.wallet.upsert({
        where: { shop_customer: { shop, customerId } },
        create: { shop, customerId, balance: pendingToTransfer, totalSpent: 0, tier: currentTier },
        update: { balance: { increment: pendingToTransfer }, tier: currentTier },
      });

      // Получить кошелёк для транзакции
      const wallet = await prisma.wallet.findUnique({
        where: { shop_customer: { shop, customerId } },
      });

      if (wallet) {
        await prisma.pointsTransaction.create({
          data: {
            walletId:    wallet.id,
            shop,
            customerId,
            type:        "cashback",
            amount:      pendingToTransfer,
            description: `Pending баллы зачислены при достижении ${currentTier} тира`,
          },
        });
      }

   } else {
  // При сбросе на Start тир (1-3 мес) — обнуляем баланс
  await prisma.wallet.upsert({
    where: { shop_customer: { shop, customerId } },
    create: { shop, customerId, balance: 0, totalSpent: 0, tier: currentTier },
    update: { tier: currentTier, balance: months <= 3 ? 0 : undefined },
  });
}

    return new Response(JSON.stringify({ success: true, customerId, months, sub, transferred: pendingToTransfer }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
