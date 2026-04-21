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
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id") || url.searchParams.get("customerId");
  const shop = url.searchParams.get("shop") || "terrea-home-rituals.myshopify.com";

  if (!customerId) {
    return Response.json({ balance: 0, transactions: [] }, { headers: corsHeaders(request) });
  }

  try {
    const wallet = await prisma.wallet.findFirst({
      where: { shop, customerId: String(customerId) },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!wallet) {
      return Response.json({ balance: 0, transactions: [] }, { headers: corsHeaders(request) });
    }

    return Response.json({
      balance: wallet.balance,
      transactions: wallet.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt,
      })),
    }, { headers: corsHeaders(request) });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500, headers: corsHeaders(request) });
  }
}

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const { customer_id, shop } = await request.json();
    const shopId = shop || "terrea-home-rituals.myshopify.com";

    if (!customer_id) {
      return Response.json({ error: "No customer_id" }, { status: 400, headers: corsHeaders(request) });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { shop: shopId, customerId: String(customer_id) }
    });

    if (!wallet || wallet.balance < 500) {
      return Response.json({ error: "Insufficient points" }, { status: 400, headers: corsHeaders(request) });
    }

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: 500 } }
    });

    const code = "REWARD-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    await prisma.pointsTransaction.create({
      data: {
        walletId: wallet.id,
        shop: shopId,
        customerId: String(customer_id),
        amount: -500,
        type: "REDEEM",
        description: "Redeemed for discount: " + code
      }
    });

    return Response.json({ success: true, code }, { headers: corsHeaders(request) });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500, headers: corsHeaders(request) });
  }
}
