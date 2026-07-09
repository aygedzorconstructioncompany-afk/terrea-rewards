import prisma from "../db.server";

const corsHeaders = (request: any) => {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
};

const STAGED_TTL_MS = 30 * 60 * 1000; // 30 минут

export async function loader({ request }: any) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  try {
    const body           = await request.json();
    const customer_id    = body.customer_id;
    const product_id     = body.product_id;
    const product_title  = body.product_title || "Unknown product";
    const product_image  = body.product_image || "";
    const price          = body.price || 0;
    const quantity       = parseInt(body.quantity) || 1;
    const act            = body.action; // "add" | "remove"
    const shop           = body.shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

    if (!customer_id || !product_id) {
      return Response.json(
        { error: "Missing customer_id or product_id" },
        { status: 400, headers: corsHeaders(request) }
      );
    }

    const sub = await prisma.subscription.findFirst({
      where: { shop, customerId: String(customer_id) }
    });

    // Читаем текущий staged-черновик (не реальные products!).
    // Если он уже истёк — считаем его пустым, начинаем заново.
    let stagedProducts: string[] = [];
    let stagedProductDetails: any[] = [];
    const notExpired =
      sub?.stagedExpiresAt && new Date(sub.stagedExpiresAt as any) > new Date();

    if (notExpired) {
      try { stagedProducts = JSON.parse(sub!.stagedProducts || "[]"); } catch {}
      try { stagedProductDetails = JSON.parse(sub!.stagedProductDetails || "[]"); } catch {}
    }

    if (act === "add") {
      if (!stagedProducts.includes(String(product_id))) {
        stagedProducts.push(String(product_id));
        stagedProductDetails.push({
          id:     String(product_id),
          title:  product_title,
          images: product_image ? [{ src: product_image }] : [],
          price,
          quantity,
        });
      } else {
        const existing = stagedProductDetails.find((p: any) => p.id === String(product_id));
        if (existing) existing.quantity = quantity;
      }
    } else if (act === "remove") {
      stagedProducts       = stagedProducts.filter((id) => id !== String(product_id));
      stagedProductDetails = stagedProductDetails.filter((p: any) => p.id !== String(product_id));
    } else {
      return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders(request) });
    }

    const stagedData = {
      stagedProducts:       JSON.stringify(stagedProducts),
      stagedProductDetails: JSON.stringify(stagedProductDetails),
      // Каждое изменение (add/remove) продлевает окно на 30 минут заново —
      // как только staged список пуст, expiresAt можно занулить.
      stagedExpiresAt: stagedProducts.length > 0
        ? new Date(Date.now() + STAGED_TTL_MS)
        : null,
    };

    if (!sub) {
      // Подписки ещё нет вообще — создаём запись только со staged-данными.
      // Явно ставим status "none", чтобы webhooks.orders.paid.ts не спутал
      // её с настоящей активной подпиской, пока не будет реальной оплаты.
      await prisma.subscription.create({
        data: {
          shop,
          customerId: String(customer_id),
          status: "none",
          ...stagedData,
        }
      });
    } else {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: stagedData,
      });
    }

    // Товар НЕ появляется в реальной подписке прямо сейчас.
    // Он попадёт туда только через webhooks.orders.paid.ts,
    // когда клиент реально оформит и оплатит заказ с этим товаром.
    return Response.json({ success: true, staged: stagedProducts }, { headers: corsHeaders(request) });
  } catch (e: any) {
    console.error("[api.subscription.cart]", e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
