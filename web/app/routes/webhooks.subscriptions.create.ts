import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const SHOP = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

async function getProductHandle(productId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://${SHOP}/admin/api/2024-01/products/${productId}.json`, {
      headers: { "X-Shopify-Access-Token": SHOPIFY_TOKEN }
    });
    const data = await res.json();
    return data.product?.handle || null;
  } catch (e) {
    console.warn("Could not fetch product handle:", (e as any).message);
    return null;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = await request.json();
    const customerId = payload.customer_id?.toString();
    const shop = request.headers.get("x-shopify-shop-domain") ||
                 process.env.SHOPIFY_SHOP_DOMAIN ||
                 "terrea-home-rituals.myshopify.com";

    if (!customerId) return new Response("No customer", { status: 400 });

    // ✅ ИЗВЛЕКАЕМ ИНФОРМАЦИЮ О ТОВАРЕ
    const productId = payload.billing_policy?.recurring_deliveries?.[0]?.product_id?.toString() || null;
    const productTitle = payload.billing_policy?.recurring_deliveries?.[0]?.product_title || null;
    const productImage = payload.billing_policy?.recurring_deliveries?.[0]?.product_image || null;
    const productPrice = payload.billing_policy?.recurring_deliveries?.[0]?.price || null;
    
    // ✅ ПОЛУЧАЕМ HANDLE АВТОМАТИЧЕСКИ
    let productHandle = null;
    if (productId) {
      productHandle = await getProductHandle(productId);
    }

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
