import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

const SHOP = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

// ✅ Генерируем handle из title без токена
function titleToHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = await request.json();
    const customerId = payload.customer_id?.toString();
    const shop = request.headers.get("x-shopify-shop-domain") ||
                 process.env.SHOPIFY_SHOP_DOMAIN ||
                 "terrea-home-rituals.myshopify.com";

    if (!customerId) return new Response("No customer", { status: 400 });

    // ✅ Извлекаем информацию о товаре из payload
    const delivery = payload.billing_policy?.recurring_deliveries?.[0];
    const productId = delivery?.product_id?.toString() || null;
    const productTitle = delivery?.product_title || null;
    const productImage = delivery?.product_image || null;
    const productPrice = delivery?.price || null;

    // ✅ Handle из title — без токена
    const productHandle = productTitle ? titleToHandle(productTitle) : null;

    console.log(`[subscriptions/create] customer=${customerId} product=${productTitle} handle=${productHandle}`);

    await prisma.wallet.upsert({
      where: { shop_customer: { shop, customerId } },
      create: { shop, customerId, balance: 0, totalSpent: 0, tier: "start" },
      update: {},
    });

    await prisma.subscription.upsert({
      where: { shop_customer: { shop, customerId } },
      create: {
        shop,
        customerId,
        status: "active",
        currentTier: "start",
        monthsActive: 0,
        pendingPoints: 0,
        subscriptionContractId: payload.id?.toString(),
        startedAt: new Date(),
        lastOrderAt: new Date(),
        productId,
        productTitle,
        productImage,
        productPrice: productPrice ? parseFloat(productPrice) : null,
        productHandle,
      },
      update: {
        status: "active",
        subscriptionContractId: payload.id?.toString(),
        lastOrderAt: new Date(),
        productId,
        productTitle,
        productImage,
        productPrice: productPrice ? parseFloat(productPrice) : null,
        productHandle,
      },
    });

    console.log(`✅ Subscription created for customer ${customerId} with product ${productTitle} (handle: ${productHandle})`);
    return new Response("OK", { status: 200 });
  } catch (e: any) {
    console.error("Error:", e.message);
    return new Response("Error", { status: 500 });
  }
}
