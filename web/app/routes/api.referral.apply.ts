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
    const { customer_id, code, shop } = await request.json();
    const shopId = shop || "terrea-dev-store.myshopify.com";

    if (!customer_id || !code) {
      return Response.json({ error: "Missing data" }, { status: 400, headers: corsHeaders(request) });
    }

    // Find referrer wallet by code
    const referrerWallet = await prisma.wallet.findFirst({
      where: { referralCode: code, shop: shopId },
    });

    if (!referrerWallet) {
      return Response.json({ error: "Invalid referral code" }, { status: 404, headers: corsHeaders(request) });
    }

    // Cannot use own code
    if (referrerWallet.customerId === String(customer_id)) {
      return Response.json({ error: "Cannot use your own code" }, { status: 400, headers: corsHeaders(request) });
    }

    // Find or create referee wallet
    let refereeWallet = await prisma.wallet.findFirst({
      where: { shop: shopId, customerId: String(customer_id) },
    });

    if (refereeWallet?.referredBy) {
      return Response.json({ error: "You already used a referral code" }, { status: 400, headers: corsHeaders(request) });
    }

    if (!refereeWallet) {
      refereeWallet = await prisma.wallet.create({
        data: {
          shop: shopId,
          customerId: String(customer_id),
          balance: 0,
          referredBy: referrerWallet.customerId,
        },
      });
    } else {
      refereeWallet = await prisma.wallet.update({
        where: { id: refereeWallet.id },
        data: { referredBy: referrerWallet.customerId },
      });
    }

    // Create referral record
    await prisma.referral.create({
      data: {
        shop: shopId,
        referrerCode: code,
        referrerId: referrerWallet.customerId,
        refereeId: String(customer_id),
        status: "pending",
      },
    });

    return Response.json({
      success: true,
      message: "Referral code applied! Your friend will earn bonuses from your purchases.",
    }, { headers: corsHeaders(request) });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}