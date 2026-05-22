import prisma from "../db.server";

const corsHeaders = (request: any) => {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, text/plain",
    "Access-Control-Allow-Credentials": "true",
  };
};

export async function loader({ request }: any) {
  return Response.json({ ok: true }, { headers: corsHeaders(request) });
}

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const text = await request.text();
    const { customer_id, shop } = JSON.parse(text);

    if (!customer_id || !shop) {
      return Response.json(
        { error: "Missing customer_id or shop" },
        { status: 400, headers: corsHeaders(request) }
      );
    }

    const existing = await prisma.subscription.findFirst({
      where: { customerId: String(customer_id), shop }
    });

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: "active",
          lastOrderAt: new Date(),
        }
      });
    } else {
      await prisma.subscription.create({
        data: {
          customerId: String(customer_id),
          shop,
          status: "active",
          monthsActive: 0,
          pendingPoints: 0,
          startedAt: new Date(),
          lastOrderAt: new Date(),
        }
      });
    }

    return Response.json(
      { success: true },
      { headers: corsHeaders(request) }
    );

  } catch (e: any) {
    return Response.json(
      { error: e.message },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}
