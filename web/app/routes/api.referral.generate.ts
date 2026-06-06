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
  const customerId  = url.searchParams.get("customer_id");
  const firstName   = url.searchParams.get("first_name") || null;
  const lastName    = url.searchParams.get("last_name")  || null;
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
    // Найти или создать кошелёк
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
          firstName,
          lastName,
        },
      });
    } else {
      // Обновить имя если передано
      const needsUpdate =
        !wallet.referralCode ||
        (firstName && wallet.firstName !== firstName) ||
        (lastName  && wallet.lastName  !== lastName);

      if (needsUpdate) {
        wallet = await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            ...(wallet.referralCode ? {} : { referralCode: generateCode(customerId) }),
            ...(firstName ? { firstName } : {}),
            ...(lastName  ? { lastName  } : {}),
          },
        });
      }
    }

    // Статистика рефералов
    const referrals = await prisma.referral.findMany({
      where: { referrerId: customerId, shop },
    });
    const totalReferrals    = referrals.length;
    const completedReferrals = referrals.filter((r) => r.status === "completed").length;
    const totalEarned        = referrals.reduce((sum, r) => sum + r.totalBonus, 0);

    // Кто пригласил текущего клиента
    let referredBy     = null;
    let referredByName = null;

    const referral = await prisma.referral.findFirst({
      where: { refereeId: customerId, shop },
    });

    if (referral) {
      const referrerWallet = await prisma.wallet.findFirst({
        where: { customerId: referral.referrerId },
      });

      if (referrerWallet) {
        // Email как запасной вариант
        if (referrerWallet.email) {
          referredBy = referrerWallet.email;
        }
        // Имя + фамилия (основной вариант)
        const parts = [referrerWallet.firstName, referrerWallet.lastName].filter(Boolean);
        if (parts.length > 0) {
          referredByName = parts.join(" ");
        }
      }
    }

    return Response.json(
      {
        code: wallet.referralCode,
        referredBy,
        referredByName,
        stats: {
          total:     totalReferrals,
          completed: completedReferrals,
          earned:    totalEarned,
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
