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

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    // ✅ Читаем как text чтобы поддержать оба Content-Type
    const text = await request.text();
    const { customer_id, shop, productTitle, productImage, productHandle, productPrice } = JSON.parse(text);

    if (!customer_id) {
      return Response.json({ error: "Missing customer_id" }, { status: 400, headers: corsHeaders(request) });
    }

    const SHOP = shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
    const customerId = String(customer_id);

    console.log(`[subscription/product] Saving product for customer ${customerId}: ${productTitle}`);

    await prisma.subscription.updateMany({
      where: { shop: SHOP, customerId },
      data: {
        productTitle: productTitle || null,
        productImage: productImage || null,
        productHandle: productHandle || null,
        productPrice: productPrice ? parseFloat(productPrice) : null,
      },
    });

    console.log(`[subscription/product] ✅ Saved: ${productTitle} for ${customerId}`);

    return Response.json({ success: true }, { headers: corsHeaders(request) });

  } catch (e: any) {
    console.error("[subscription/product] Error:", e.message);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}

export async function loader({ request }: any) {
  return Response.json({ ok: true }, { headers: corsHeaders(request) });
}
