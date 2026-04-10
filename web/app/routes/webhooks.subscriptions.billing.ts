import type { ActionFunctionArgs } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = await request.json();
    const contractId = payload.subscription_contract_id?.toString();
    const shop = request.headers.get("x-shopify-shop-domain") || "terrea-dev-store.myshopify.com";

    if (!contractId) return new Response("No contract", { status: 400 });

    const customer = await prisma.customer.findFirst({
      where: { subscriptionContractId: contractId, shop },
    });

    if (!customer) return new Response("Customer not found", { status: 404 });

    const months = customer.monthsActive || 0;
    let points = 1;
    if (months >= 3 && months < 6) points = 2;
    else if (months >= 6 && months < 9) points = 3;
    else if (months >= 9) points = 5;

    await prisma.customer.update({
      where: { id: customer.id },
      data: { monthsActive: { increment: 1 } },
    });

    await prisma.pointTransaction.create({
      data: {
        customerId: customer.id,
        amount: points,
        type: "subscription_monthly",
        description: `Month ${months + 1} subscription reward`,
      },
    });

    await prisma.wallet.upsert({
      where: { customerId: customer.id },
      create: { customerId: customer.id, balance: points },
      update: { balance: { increment: points } },
    });

    console.log(`Awarded ${points} pts to customer ${customer.id}`);
    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("Error:", e);
    return new Response("Error", { status: 500 });
  }
}
