import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customerId");
  const shop = request.headers.get("x-shopify-shop-domain");

  if (!customerId) {
    return json({ error: "No customerId" }, { status: 400 });
  }

  await prisma.subscription.deleteMany({
    where: { customerId }
  });

  return json({ ok: true });
}
