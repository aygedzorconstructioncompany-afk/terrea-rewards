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

const json = (data: any, status = 200, request?: any) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(request ? corsHeaders(request) : {}),
    },
  });

// GET /api/redeem?customer_id=xxx&shop=xxx&order_total=xxx
export async function loader({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url        = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
 const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
  const orderTotal = parseFloat(url.searchParams.get("order_total") || "0");

  if (!customerId) {
    return json({ error: "No customer_id" }, 400, request);
  }

  try {
    const wallet = await prisma.wallet.findUnique({
      where:   { shop_customer: { shop, customerId } },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!wallet) {
      return json({ balance: 0, maxRedeem: 0, totalSpent: 0, tier: "start", transactions: [] }, 200, request);
    }

    const maxRedeem = orderTotal > 0
      ? Math.min(wallet.balance, Math.floor(orderTotal * 0.5))
      : wallet.balance;

    return json({
      balance:    wallet.balance,
      maxRedeem,
      totalSpent: wallet.totalSpent,
      tier:       wallet.tier,
      transactions: wallet.transactions.map((t: any) => ({
        type: t.type, amount: t.amount, description: t.description, createdAt: t.createdAt,
      })),
    }, 200, request);

  } catch (e: any) {
    return json({ error: e.message }, 500, request);
  }
}

// POST /api/redeem
// Тело: { customer_id, shop, order_total, redeem_amount, order_id? }
export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad JSON" }, 400, request);
  }

  const {
    customer_id:   customerId,
    shop         = "terrea-dev-store.myshopify.com",
    order_id:      orderId,
    order_total:   orderTotal,
    redeem_amount: redeemAmount,
  } = body;

  if (!customerId || !orderTotal) {
    return json({ error: "Missing customer_id or order_total" }, 400, request);
  }

  if (!redeemAmount || redeemAmount <= 0) {
    return json({ success: true, redeemed: 0, message: "Nothing to redeem" }, 200, request);
  }

  try {
    const wallet = await prisma.wallet.findUnique({
      where: { shop_customer: { shop, customerId } },
    });

    if (!wallet || wallet.balance <= 0) {
      return json({ error: "No balance" }, 400, request);
    }

    const maxAllowed = Math.min(wallet.balance, Math.floor(orderTotal * 0.5));
    const toRedeem   = Math.min(redeemAmount, maxAllowed);

    if (toRedeem <= 0) {
      return json({ error: "Redeem amount exceeds limit (max 50% of order total)" }, 400, request);
    }

    // Списать с баланса
    await prisma.wallet.update({
      where: { shop_customer: { shop, customerId } },
      data:  { balance: { decrement: toRedeem } },
    });

    // Записать транзакцию
    await prisma.pointsTransaction.create({
      data: {
        walletId:    wallet.id,
        shop,
        customerId,
        orderId:     orderId || ("manual-" + Date.now()),
        type:        "redeemed",
        amount:      -toRedeem,
        description: `Списание ${toRedeem} pts (выбрано покупателем)`,
      },
    });

    console.log(`[redeem] ✅ ${toRedeem} pts redeemed for ${customerId}`);

    return json({
      success:    true,
      redeemed:   toRedeem,
      newBalance: wallet.balance - toRedeem,
      message:    `Списано ${toRedeem} pts`,
    }, 200, request);

  } catch (e: any) {
    return json({ error: e.message }, 500, request);
  }
}
