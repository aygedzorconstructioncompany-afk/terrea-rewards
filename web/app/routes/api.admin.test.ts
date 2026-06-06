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

async function getCustomerName(shop: string, customerId: string): Promise<string | null> {
  try {
    const session = await (prisma as any).session.findFirst({
      where: { shop },
    });

    console.log('[getCustomerName] session:', session
      ? `found, token: ${session.accessToken ? 'YES' : 'NO TOKEN'}`
      : 'NOT FOUND');

    if (!session?.accessToken) return null;

    const numericId = customerId.replace("gid://shopify/Customer/", "");
    console.log('[getCustomerName] fetching customer id:', numericId);

    const res = await fetch(
      `https://${shop}/admin/api/2024-01/customers/${numericId}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": session.accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    console.log('[getCustomerName] Shopify API status:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.log('[getCustomerName] Shopify API error body:', text);
      return null;
    }

    const data = await res.json();
    const c = data.customer;
    const fullName = [c?.first_name, c?.last_name].filter(Boolean).join(" ");
    console.log('[getCustomerName] fullName:', fullName);
    return fullName || null;
  } catch (e: any) {
    console.log('[getCustomerName] exception:', e.message);
    return null;
  }
}

export async function loader({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  const shop =
    url.searchParams.get("shop") ||
    process.env.SHOPIFY_SHOP_DOMAIN ||
    "terrea-home-rituals.myshopify.com";

  if (!customerId) {
    return Response.json(
      { error: "No customerId" },
      { status: 400, headers: corsHeaders(request) }
    );
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

    const referrals = await prisma.referral.findMany({
      where: { referrerId: customerId, shop },
    });
    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter((r) => r.status === "completed").length;
    const totalEarned = referrals.reduce((sum, r) => sum + r.totalBonus, 0);

    let referredBy = null;
    let referredByName = null;

    const referral = await prisma.referral.findFirst({
      where: { refereeId: customerId, shop },
    });

    if (referral) {
      const referrerWallet = await prisma.wallet.findFirst({
        where: { customerId: referral.referrerId },
      });

      if (referrerWallet?.email) {
        referredBy = referrerWallet.email;
      }

      const name = await getCustomerName(shop, referral.referrerId);
      if (name) {
        referredByName = name;
      }
    }

    return Response.json(
      {
        code: wallet.referralCode,
        referredBy,
        referredByName,
        stats: {
          total: totalReferrals,
          completed: completedReferrals,
          earned: totalEarned,
        },
      },
      { headers: corsHeaders(request) }
    );
  } catch (e: any) {
    console.error(e);
    return Response.json(
      { error: e.message },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}
