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

export async function loader({ request }: any) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const { customer_id, code, shop } = await request.json();
    const shopId = shop || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

    if (!customer_id || !code) {
      return json({ error: "Missing data" }, 400, request);
    }

    // Найти реферрера по коду
    const referrerWallet = await prisma.wallet.findFirst({
      where: { referralCode: code, shop: shopId },
    });

    if (!referrerWallet) {
      return json({ error: "Invalid referral code" }, 404, request);
    }

    // Нельзя использовать свой код
    if (referrerWallet.customerId === String(customer_id)) {
      return json({ error: "Cannot use your own code" }, 400, request);
    }

    // 🚫 Анти-кольцо: реферрер сам был приглашён этим пользователем
    if (referrerWallet.referredBy === String(customer_id)) {
      return json({ error: "Circular referral not allowed" }, 400, request);
    }

    // Найти кошелёк реферала
    let refereeWallet = await prisma.wallet.findFirst({
      where: { shop: shopId, customerId: String(customer_id) },
    });

    // Уже есть реферер — нельзя менять
    if (refereeWallet?.referredBy) {
      return json({ error: "You already used a referral code" }, 400, request);
    }

    if (!refereeWallet) {
      refereeWallet = await prisma.wallet.create({
        data: {
          shop:       shopId,
          customerId: String(customer_id),
          balance:    0,
          referredBy: referrerWallet.customerId,
        },
      });
    } else {
      refereeWallet = await prisma.wallet.update({
        where: { id: refereeWallet.id },
        data:  { referredBy: referrerWallet.customerId },
      });
    }

    // Создать/обновить запись реферала — сохраняем appliedAt
    await prisma.referral.upsert({
      where:  { referrerCode: code },
      create: {
        shop:         shopId,
        referrerCode: code,
        referrerId:   referrerWallet.customerId,
        refereeId:    String(customer_id),
        status:       "pending",
        appliedAt:    new Date(),
      },
      update: {
        refereeId: String(customer_id),
        status:    "pending",
        appliedAt: new Date(),
      },
    });

    console.log(`[referral/apply] ✅ ${customer_id} applied code ${code} from ${referrerWallet.customerId}`);

    return json({
      success: true,
      message: "Referral code applied! You'll earn bonus cashback on your purchases.",
    }, 200, request);

  } catch (e: any) {
    console.error("[referral/apply] Error:", e);
    return json({ error: e.message }, 500, request);
  }
}
