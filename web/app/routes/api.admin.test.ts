import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  const months = parseInt(url.searchParams.get("months") || "0");
  const secret = url.searchParams.get("secret");

  if (secret !== "terrea-admin-2024") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (!customerId || !months) {
    return new Response(JSON.stringify({ error: "customer_id and months required" }), { status: 400 });
  }

  const date = new Date();
  date.setMonth(date.getMonth() - months);

  try {
    const sub = await prisma.subscription.upsert({
      where: { shop_customerId: { customerId: customerId, shop: "terrea-dev-store.myshopify.com" } },
      create: {
        customerId: customerId,
        shop: "terrea-dev-store.myshopify.com",
        startedAt: date,
        monthsActive: months,
        status: "active",
        currentTier: months >= 10 ? "gold" : months >= 7 ? "silver" : months >= 4 ? "silver" : "bronze",
        pendingPoints: 0,
      },
      update: {
        startedAt: date,
        monthsActive: months,
        status: "active",
        currentTier: months >= 10 ? "gold" : months >= 7 ? "silver" : months >= 4 ? "silver" : "bronze",
      }
    });

    return new Response(JSON.stringify({ success: true, customerId, months, sub }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
