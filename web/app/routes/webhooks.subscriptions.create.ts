import type { ActionFunctionArgs } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = await request.json();
    const customerId = payload.customer_id?.toString();
   const shop = request.headers.get("x-shopify-shop-domain") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

    if (!customerId) return new Response("No customer", { status: 400 });

    await prisma.customer.upsert({
      where: { shopifyCustomerId_shop: { shopifyCustomerId: customerId, shop } },
      create: {
        shopifyCustomerId: customerId,
        shop,
        subscriptionActive: true,
        subscriptionStartDate: new Date(),
        monthsActive: 0,
        subscriptionContractId: payload.id?.toString(),
      },
      update: {
        subscriptionActive: true,
        subscriptionStartDate: new Date(),
        subscriptionContractId: payload.id?.toString(),
      },
    });

    console.log(`Subscription created for customer ${customerId}`);
    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("Error:", e);
    return new Response("Error", { status: 500 });
  }
}
