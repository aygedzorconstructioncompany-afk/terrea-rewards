import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

function titleToHandle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = await request.json();
    const customerId = payload.customer_id?.toString();
    const shop = request.headers.get("x-shopify-shop-domain") ||
                 process.env.SHOPIFY_SHOP_DOMAIN ||
                 "terrea-home-rituals.myshopify.com";

    if (!customerId) return new Response("No customer", { status: 400 });

    const delivery = payload.billing_policy?.recurring_deliveries?.[0];
    const productId = delivery?.product_id?.toString() || null;
    const productTitle = delivery?.product_title || null;
    const productImage = delivery?.product_image || null;
    const productPrice = delivery?.price || null;
    const productHandle = productTitle ? titleToHandle(productTitle) : null;

    console.log(`[subscriptions/create] customer=${customerId} product=${productTitle}`);

    await prisma.wallet.upsert({
      where: { shop_customer: { shop, customerId } },
      create: { shop, customerId, balance: 0, totalSpent: 0, tier: "start" },
      update: {},
    });

    // Получаем существующую подписку
    const existing = await prisma.subscription.findFirst({
      where: { shop, customerId }
    });

    // Обновляем массив products и productDetails
    let existingProducts: string[] = [];
    let existingDetails: any[] = [];

    if (existing) {
      try { existingProducts = existing.products ? JSON.parse(existing.products) : []; } catch {}
      try { existingDetails = (existing as any).productDetails ? JSON.parse((existing as any).productDetails) : []; } catch {}
    }

    // Добавляем новый товар если его ещё нет
    if (productId && !existingProducts.includes(productId)) {
      existingProducts.push(productId);
      existingDetails.push({
        id: productId,
        title: productTitle,
        images: productImage ? [{ src: productImage }] : []
      });
    }

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
        products: JSON.stringify(existingProducts),
        productDetails: JSON.stringify(existingDetails),
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
        products: JSON.stringify(existingProducts),
        productDetails: JSON.stringify(existingDetails),
      },
    });

    console.log(`✅ Subscription updated for customer ${customerId}, products: ${existingProducts}`);
    return new Response("OK", { status: 200 });
  } catch (e: any) {
    console.error("Error:", e.message);
    return new Response("Error", { status: 500 });
  }
}
