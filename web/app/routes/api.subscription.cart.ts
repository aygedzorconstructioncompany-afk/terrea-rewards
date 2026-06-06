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

// Нужен loader для обработки OPTIONS preflight
export async function loader({ request }: any) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const body        = await request.json();
    const customer_id    = body.customer_id;
    const product_id     = body.product_id;
    const product_title  = body.product_title || "Unknown product";
    const product_image  = body.product_image || "";
    const price          = body.price || 0;
    const act            = body.action;
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

    let products: string[] = [];
    let productDetails: any[] = [];

    if (sub?.products) {
      try { products = JSON.parse(sub.products); } catch {}
    }
    if ((sub as any)?.productDetails) {
      try { productDetails = JSON.parse((sub as any).productDetails); } catch {}
    }

    if (act === "add") {
      if (!products.includes(String(product_id))) {
        products.push(String(product_id));
        productDetails.push({
          id:     String(product_id),
          title:  product_title,
          images: product_image ? [{ src: product_image }] : [],
          price,
        });
      }
    } else if (act === "remove") {
      products       = products.filter((id) => id !== String(product_id));
      productDetails = productDetails.filter((p: any) => p.id !== String(product_id));
    } else {
      return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders(request) });
    }

    const updateData = {
      products:       JSON.stringify(products),
      productDetails: JSON.stringify(productDetails),
    };

    if (!sub) {
      await prisma.subscription.create({
        data: { shop, customerId: String(customer_id), status: "active", ...updateData }
      });
    } else {
      await prisma.subscription.update({
        where: { id: sub.id },
        data:  updateData,
      });
    }

    return Response.json({ success: true, products }, { headers: corsHeaders(request) });
  } catch (e: any) {
    console.error("[api.subscription.cart]", e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
