import prisma from "../db.server";

const corsHeaders = (request: any) => {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
    "Access-Control-Allow-Credentials": "true",
  };
};

function getTier(monthsActive: number) {
  if (monthsActive >= 10) return { tier: "belong+", rate: 0.20, next: null, monthsToNext: 0 };
  if (monthsActive >= 7)  return { tier: "belong",  rate: 0.20, next: "belong+", monthsToNext: 10 - monthsActive };
  if (monthsActive >= 4)  return { tier: "stay",    rate: 0.15, next: "belong",  monthsToNext: 7 - monthsActive };
  return                         { tier: "start",   rate: 0.10, next: "stay",    monthsToNext: 4 - monthsActive };
}

const PENDING_TTL_MS = 30 * 60 * 1000; // 30 минут

export async function loader({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "hrwxgq-ka.myshopify.com";

  if (!customerId) {
    return Response.json({ error: "No customer_id" }, { status: 400, headers: corsHeaders(request) });
  }
  try {
    const sub = await prisma.subscription.findFirst({
      where: { shop, customerId: String(customerId) }
    });

    let subscribedProducts: string[] = [];
    let productDetails: any[] = [];

    if (sub?.products) {
      try { subscribedProducts = JSON.parse(sub.products); } catch {}
    }
    if ((sub as any)?.productDetails) {
      try { productDetails = JSON.parse((sub as any).productDetails); } catch {}
    }

    if (!sub) {
      return Response.json({
        active: false, monthsActive: 0, tier: "start", rate: 10,
        pendingPoints: 0, next: "stay", monthsToNext: 4,
        subscribedProducts: [],
        allProducts: [],
        productDetails: [],
      }, { headers: corsHeaders(request) });
    }

    const tierInfo = getTier(sub.monthsActive);

    return Response.json({
      active: sub.status === "active",
      status: sub.status,
      monthsActive: sub.monthsActive,
      tier: tierInfo.tier,
      rate: Math.round(tierInfo.rate * 100),
      pendingPoints: sub.pendingPoints,
      next: tierInfo.next,
      monthsToNext: tierInfo.monthsToNext,
      startedAt: sub.startedAt,
      lastOrderAt: sub.lastOrderAt,
      pendingExpiresAt: (sub as any).pendingExpiresAt || null,
      subscribedProducts,
      allProducts: productDetails,
      productDetails,
    }, { headers: corsHeaders(request) });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  const url = new URL(request.url);

  try {
    const body = await request.json();
    const { customer_id, action: act, products, productDetails, status, shop: bodyShop } = body;
    const shop = bodyShop || url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "hrwxgq-ka.myshopify.com";

    if (!customer_id) {
      return Response.json({ error: "No customer_id" }, { status: 400, headers: corsHeaders(request) });
    }

    if (act === "update_products") {
      const sub = await prisma.subscription.findFirst({
        where: { shop, customerId: String(customer_id) }
      });

      const wantsPending = status === "pending";

      // Защита: если подписка существует и НЕ active — менять список товаров
      // можно только через явный confirmOrder() с status:'pending' (новое оформление,
      // требующее оплаты). Обычный "Add product" / "Save qty" (без status) не должен
      // молча работать на pending/cancelled/paused подписке — иначе получится
      // добавить товары без оплаты, а затем случайный будущий заказ активирует
      // подписку с этими бесплатно добавленными товарами.
      if (sub && sub.status !== "active" && !wantsPending) {
        return Response.json(
          { error: "Subscription is not active. Please complete checkout to add or change products." },
          { status: 400, headers: corsHeaders(request) }
        );
      }

      const updateData: any = {
        products: JSON.stringify(products || []),
      };
      if (productDetails) {
        updateData.productDetails = JSON.stringify(productDetails);
      }

      if (!sub) {
        await prisma.subscription.create({
          data: {
            shop,
            customerId: String(customer_id),
            status: wantsPending ? "pending" : "active",
            pendingExpiresAt: wantsPending ? new Date(Date.now() + PENDING_TTL_MS) : null,
            ...updateData,
          }
        });
      } else {
        // Не понижаем уже активную подписку до pending — pending имеет смысл
        // только для новой записи или для отменённой/просроченной подписки
        if (wantsPending && sub.status !== "active") {
          updateData.status = "pending";
          updateData.pendingExpiresAt = new Date(Date.now() + PENDING_TTL_MS);
        }
        await prisma.subscription.update({
          where: { id: sub.id },
          data: updateData
        });
      }
      return Response.json({ success: true }, { headers: corsHeaders(request) });
    }

    if (act === "pause" || act === "resume" || act === "cancel") {
      const statusMap: Record<string, string> = { pause: "paused", resume: "active", cancel: "cancelled" };
      await prisma.subscription.updateMany({
        where: { shop, customerId: String(customer_id) },
        data: { status: statusMap[act], pendingExpiresAt: null }
      });
      return Response.json({ success: true }, { headers: corsHeaders(request) });
    }

    if (act === "create") {
      const wantsPending = status === "pending";
      const existing = await prisma.subscription.findFirst({
        where: { shop, customerId: String(customer_id) }
      });
      if (!existing) {
        await prisma.subscription.create({
          data: {
            shop,
            customerId: String(customer_id),
            status: wantsPending ? "pending" : "active",
            pendingExpiresAt: wantsPending ? new Date(Date.now() + PENDING_TTL_MS) : null,
            products: JSON.stringify(products || [])
          }
        });
      } else {
        if (wantsPending && existing.status !== "active") {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: { status: "pending", pendingExpiresAt: new Date(Date.now() + PENDING_TTL_MS) }
          });
        } else if (!wantsPending) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: { status: "active", pendingExpiresAt: null }
          });
        }
      }
      return Response.json({ success: true }, { headers: corsHeaders(request) });
    }

    return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders(request) });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
