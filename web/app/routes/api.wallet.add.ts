import { json } from "@remix-run/node";
import prisma from "../db.server";

const SHOP = "terrea-dev-store.myshopify.com";

export async function loader({ request }) {
  const url = new URL(request.url);

  const customerId = url.searchParams.get("customerId");
  const amount = Number(url.searchParams.get("amount"));

  if (!customerId || !amount) {
    return json(
      { error: "Missing data" },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  const wallet = await prisma.wallet.upsert({
    where: {
      shop_customer: {
        shop: SHOP,
        customerId: String(customerId),
      },
    },
    update: {
      balance: { increment: amount },
    },
    create: {
      shop: SHOP,
      customerId: String(customerId),
      balance: amount,
    },
  });

  return json(
    { success: true, balance: wallet.balance },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}