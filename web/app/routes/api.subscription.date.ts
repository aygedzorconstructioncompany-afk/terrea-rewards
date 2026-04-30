import prisma from "../db.server";

const corsHeaders = (request: any) => {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
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
    const body = await request.json();
    const { customer_id, shop, billing_date } = body;
    if (!customer_id || !shop) {
      return Response.json(
        { error: "Missing customer_id or shop" },
        { status: 400, headers: corsHeaders(request) }
      );
    }
    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: "active",
          billingDate: billing_date ? new Date(billing_date) : undefined,
          lastOrderAt: new Date(),
        }
      });
    }
    } else {
      await prisma.subscription.create({
        data: {
          customerId: String(customer_id),
          shop,
          status: "active",
          monthsActive: 0,
          pendingPoints: 0,
          billingDate: billing_date ? new Date(billing_date) : new Date(),
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
