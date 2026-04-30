import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader() {
  const now = new Date();

  const subs = await prisma.subscription.findMany({
    where: {
      status: "active",
      nextChargeDate: {
        lte: now
      }
    }
  });

  for (const sub of subs) {
    // 💳 тут будет списание (пока просто лог)
    console.log("Charging customer:", sub.customerId);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        nextChargeDate: new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000
        )
      }
    });
  }

  return json({ ok: true });
}
