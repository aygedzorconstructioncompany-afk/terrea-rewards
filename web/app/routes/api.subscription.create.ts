import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function action({ request }) {
  const { customerId, shop } = await request.json();

  if (!customerId) {
    return json({ error: "No customerId" }, { status: 400 });
  }

  const existing = await prisma.subscription.findFirst({
    where: { customerId }
  });

  if (existing) {
    return json({ ok: true });
  }

  await prisma.subscription.create({
    data: {
      shop,
      customerId,
      status: "active",
      nextChargeDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      )
    }
  });

  return json({ ok: true });
}
