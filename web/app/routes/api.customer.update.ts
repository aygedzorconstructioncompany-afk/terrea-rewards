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

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders(request) });
  }

  try {
    const body       = await request.json();
    const customerId = body.customer_id;
    const newEmail   = body.email?.trim();
    const shop       = body.shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

    if (!customerId || !newEmail) {
      return Response.json({ error: "Missing customer_id or email" }, { status: 400, headers: corsHeaders(request) });
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return Response.json({ error: "Invalid email format" }, { status: 400, headers: corsHeaders(request) });
    }

    // Получаем access token из сессии
    const session = await (prisma as any).session.findFirst({
      where: { shop },
    });

    if (!session?.accessToken) {
      return Response.json({ error: "No session found" }, { status: 401, headers: corsHeaders(request) });
    }

    // Числовой ID
    const numericId = customerId.replace("gid://shopify/Customer/", "");

    // Обновляем email через Shopify Admin API
    const res = await fetch(
      `https://${shop}/admin/api/2024-01/customers/${numericId}.json`,
      {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": session.accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customer: { id: numericId, email: newEmail } }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.errors?.email?.[0] || data?.errors || "Failed to update email";
      return Response.json({ error: errMsg }, { status: res.status, headers: corsHeaders(request) });
    }

    // Обновляем email в нашей БД тоже
    await prisma.wallet.updateMany({
      where: { customerId, shop },
      data:  { email: newEmail },
    });

    return Response.json(
      { success: true, email: data.customer.email },
      { headers: corsHeaders(request) }
    );
  } catch (e: any) {
    console.error("[api.customer.update]", e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
