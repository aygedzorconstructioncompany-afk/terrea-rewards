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

function generateCode(customerId: string): string {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return "REF-" + customerId.slice(-4) + "-" + random;
}

export async function loader({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";

  if (!customerId) {
    return Response.json({ error: "No customerId" }, { status: 400, headers: corsHeaders(request) });
  }

  try {
    let wallet = await prisma.wallet.findFirst({
      where: { shop, customerId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          shop,
          customerId,
          balance: 0,
          referralCode: generateCode(customerId),
        },
      });
    } else if (!wallet.referralCode) {
      wallet = await prisma.wallet.update({
        where: { id: wallet.id },
        data: { referralCode: generateCode(customerId) },
      });
    }

    // Count referrals
    const referrals = await prisma.referral.findMany({
      where: { referrerId: customerId, shop },
    });

    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter(r => r.status === "completed").length;
    const totalEarned = referrals.reduce((sum, r) => sum + r.totalBonus, 0);

    return Response.json({
      code: wallet.referralCode,
      stats: {
        total: totalReferrals,
        completed: completedReferrals,
        earned: totalEarned,
      },
    }, { headers: corsHeaders(request) });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders(request) });
  }
}
