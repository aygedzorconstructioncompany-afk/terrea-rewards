import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

const corsHeaders = (request: Request) => {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
    "Access-Control-Allow-Credentials": "true",
  };
};

// GET /api/redeem?customer_id=xxx&shop=xxx&order_total=xxx
// Возвращает баланс и максимум доступный к списанию
export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url        = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  const shop       = url.searchParams.get("shop") || "terrea-dev-store.myshopify.com";
  const orderTotal = parseFloat(url.searchParams.get("order_total") || "0");

  if (!customerId) {
    return Response.json({ error: "No customer_id" }, { status: 400, headers: corsHeaders(request) });
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
      return Response.json({
        balance:    0,
        maxRedeem:  0,
        totalSpent: 0,
        tier:       "start",
        transactions: [],
      }, { headers: corsHeaders(request) });
    }

    // Максимум 50% от суммы заказа
    const maxRedeem = orderTotal > 0
      ? Math.min(wallet.balance, Math.floor(orderTotal * 0.5))
      : wallet.balance;

    return Response.json({
      balance:    wallet.balance,
      maxRedeem,                    // ← сколько максимум можно списать
      totalSpent: wallet.totalSpent,
      tier:       wallet.tier,
      transactions: wallet.transactions.map(t => ({
        type:        t.type,
        amount:      t.amount,
        description: t.description,
        createdAt:   t.createdAt,
      })),
    }, { headers: corsHeaders(request) });

  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}

// POST /api/redeem
// Тело: { customer_id, shop, order_id, order_total, redeem_amount }
// redeem_amount — сколько покупатель хочет списать (от 0 до maxRedeem)
export async function action({ request }: ActionFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad JSON" }, { status: 400, headers: corsHeaders(request) });
  }

  const {
    customer_id: customerId,
    shop        = "terrea-dev-store.myshopify.com",
    order_id:    orderId,
    order_total: orderTotal,
    redeem_amount: redeemAmount, // сколько хочет списать покупатель
  } = body;

  if (!customerId || !orderId || !orderTotal) {
    return Response.json(
      { error: "Missing customer_id, order_id or order_total" },
      { status: 400, headers: corsHeaders(request) }
    );
  }

  if (!redeemAmount || redeemAmount <= 0) {
    return Response.json({
      success: true,
      redeemed: 0,
      message: "Nothing to redeem",
    }, { headers: corsHeaders(request) });
  }

  try {
    const wallet = await prisma.wallet.findUnique({
      where: { shop_customer: { shop, customerId } },
    });

    if (!wallet || wallet.balance <= 0) {
      return Response.json(
        { error: "No balance" },
        { status: 400, headers: corsHeaders(request) }
      );
    }

    // Проверка: не больше баланса и не больше 50% от заказа
    const maxAllowed = Math.min(wallet.balance, Math.floor(orderTotal * 0.5));
    const toRedeem   = Math.min(redeemAmount, maxAllowed);

    if (toRedeem <= 0) {
      return Response.json(
        { error: "Redeem amount exceeds limit (max 50% of order total)" },
        { status: 400, headers: corsHeaders(request) }
      );
    }

    // Применить скидку через Shopify Admin API
    const applied = await applyShopifyDiscount(shop, orderId, toRedeem);

    if (!applied) {
      return Response.json(
        { error: "Failed to apply discount via Shopify API" },
        { status: 500, headers: corsHeaders(request) }
      );
    }

    // Списать с баланса
    await prisma.wallet.update({
      where: { shop_customer: { shop, customerId } },
      data:  { balance: { decrement: toRedeem } },
    });

    await prisma.pointsTransaction.create({
      data: {
        walletId:    wallet.id,
        shop,
        customerId,
        orderId,
        type:        "redeemed",
        amount:      -toRedeem,
        description: `Списание ${toRedeem} pts к заказу (выбрано покупателем)`,
      },
    });

    return Response.json({
      success:    true,
      redeemed:   toRedeem,
      newBalance: wallet.balance - toRedeem,
      message:    `Списано ${toRedeem} pts`,
    }, { headers: corsHeaders(request) });

  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}

// ─── Shopify Admin API ────────────────────────────────────────────────────────
async function applyShopifyDiscount(shop: string, orderId: string, amount: number): Promise<boolean> {
  try {
    const session = await prisma.session.findFirst({
      where: { shop, isOnline: false },
    });
    const token = session?.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;
    if (!token) {
      console.error("[redeem] No access token");
      return false;
    }

    const response = await fetch(
      `https://${shop}/admin/api/2024-01/orders/${orderId}/adjustments.json`,
      {
        method: "POST",
        headers: {
          "Content-Type":           "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({
          order_adjustment: {
            kind:       "refund_discrepancy",
            reason:     `Terrea Rewards — ${amount} pts`,
            amount:     `-${amount}.00`,
            tax_amount: "0.00",
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("[redeem] Shopify error:", await response.text());
      return false;
    }

    console.log(`[redeem] ✅ Discount ${amount} applied to order ${orderId}`);
    return true;
  } catch (e: any) {
    console.error("[redeem] Exception:", e.message);
    return false;
  }
}
