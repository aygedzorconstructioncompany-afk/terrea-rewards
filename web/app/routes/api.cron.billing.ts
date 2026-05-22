import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function action({ request }) {
  const { customerId, actionType } = await request.json();

  const sub = await prisma.subscription.findFirst({
    where: { customerId: String(customerId) }
  });

  if (!sub) {
    return json({ error: "No subscription" }, { status: 404 });
  }

  const now = new Date();

  // 🔸 PAUSE
  if (actionType === "pause") {
    const daysLeft = Math.ceil(
      (new Date(sub.nextChargeDate).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "paused",
        daysLeft: Math.max(daysLeft, 0),
        nextChargeDate: null
      }
    });

    return json({ ok: true });
  }

  // 🔸 RESUME
  if (actionType === "resume") {
    const nextCharge = new Date(
      now.getTime() + (sub.daysLeft || 30) * 24 * 60 * 60 * 1000
    );

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "active",
        nextChargeDate: nextCharge,
        daysLeft: null
      }
    });

    return json({ ok: true });
  }

  // 🔸 CANCEL
  if (actionType === "cancel") {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "canceled",
        nextChargeDate: null,
        daysLeft: null
      }
    });

    return json({ ok: true });
  }

  return json({ error: "Unknown action" }, { status: 400 });
}
