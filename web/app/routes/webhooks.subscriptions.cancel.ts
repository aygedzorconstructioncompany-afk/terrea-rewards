import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = await request.json();
    const customerId = payload.customer_id?.toString();
    const shopifyStatus = payload.status?.toString().toLowerCase();
    const shop = request.headers.get("x-shopify-shop-domain") ||
                 process.env.SHOPIFY_SHOP_DOMAIN ||
                 "terrea-home-rituals.myshopify.com";

    if (!customerId) return new Response("No customer", { status: 400 });

    const sub = await prisma.subscription.findFirst({
      where: { shop, customerId },
    });

    if (!sub) {
      console.log(`[subscriptions/update] No subscription found for ${customerId}`);
      return new Response("OK", { status: 200 });
    }

    // Маппинг Shopify статусов на наши
    let newStatus = sub.status;
    if (shopifyStatus === "cancelled" || shopifyStatus === "canceled") {
      newStatus = "cancelled";
    } else if (shopifyStatus === "paused") {
      newStatus = "paused";
    } else if (shopifyStatus === "active") {
      newStatus = "active";
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: newStatus,
        ...(newStatus === "cancelled" ? { monthsActive: 0, pendingPoints: 0 } : {}),
      },
    });

    console.log(`✅ Subscription status=${newStatus} for customer ${customerId}`);
    return new Response("OK", { status: 200 });
  } catch (e: any) {
    console.error("Error:", e.message);
    return new Response("Error", { status: 500 });
  }
}
