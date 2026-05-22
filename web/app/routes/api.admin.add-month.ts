import prisma from "../db.server";

function getTier(monthsActive: number): string {
  if (monthsActive >= 10) return "belong+";
  if (monthsActive >= 7)  return "belong";
  if (monthsActive >= 4)  return "stay";
  return "start";
}

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const customerId = url.searchParams.get("customer_id");
  const shop = url.searchParams.get("shop") || "terrea-home-rituals.myshopify.com";
  const months = parseInt(url.searchParams.get("months") || "1");

  if (secret !== "terrea-admin-2024") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (!customerId) {
    return new Response(JSON.stringify({ error: "Missing customer_id" }), { status: 400 });
  }

  try {
    const sub = await prisma.subscription.findFirst({
      where: { shop, customerId },
    });

    if (!sub) {
      return new Response(JSON.stringify({ error: "Subscription not found" }), { status: 404 });
    }

    const newMonthsActive = sub.monthsActive + months;
    const newTier = getTier(newMonthsActive);

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        monthsActive: newMonthsActive,
        currentTier: newTier,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      monthsActive: updated.monthsActive,
      tier: newTier,
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
