import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader() {
  const shop = "terrea-dev-store.myshopify.com";
  const customerId = "demo-user-1";

  const wallet = await prisma.wallet.findUnique({
    where: {
      shop_customer: { shop, customerId },
    },
  });

  if (!wallet || wallet.balance < 100) {
    return json({ error: "Not enough points" });
  }

  // списываем баллы
  await prisma.wallet.update({
    where: {
      shop_customer: { shop, customerId },
    },
    data: {
      balance: { decrement: 100 },
    },
  });

  // создаём discount
  const discount = await prisma.discount.create({
    data: {
      code: "DEMO-" + Math.random().toString(36).substring(7),
      customerId,
      shop,
      amount: 10,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return json(discount);
}