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
  const firstName  = url.searchParams.get("first_name") || null;
  const lastName   = url.searchParams.get("last_name")  || null;
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
      // Создаём через raw SQL чтобы включить firstName/lastName
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Wallet" (id, shop, "customerId", balance, "totalSpent", tier, "referralCode", "firstName", "lastName")
         VALUES (gen_random_uuid(), $1, $2, 0, 0, 'Basic', $3, $4, $5)
         ON CONFLICT (shop, "customerId") DO NOTHING`,
        shop, customerId, generateCode(customerId), firstName, lastName
      );
      wallet = await prisma.wallet.findFirst({ where: { shop, customerId } });
    } else {
      // Обновить имя через raw SQL
      if (firstName || lastName) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Wallet" SET
            "firstName" = COALESCE($1, "firstName"),
            "lastName"  = COALESCE($2, "lastName"),
            "referralCode" = COALESCE("referralCode", $3)
           WHERE shop = $4 AND "customerId" = $5`,
          firstName, lastName, generateCode(customerId), shop, customerId
        );
        wallet = await prisma.wallet.findFirst({ where: { shop, customerId } });
      }
    }

    // Статистика рефералов
    const referrals = await prisma.referral.findMany({
      where: { referrerId: customerId, shop },
    });
    const totalReferrals     = referrals.length;
    const completedReferrals = referrals.filter((r) => r.status === "completed").length;
    const totalEarned        = referrals.reduce((sum, r) => sum + r.totalBonus, 0);

    // Кто пригласил текущего клиента — через raw SQL
    let referredBy     = null;
    let referredByName = null;

    const referral = await prisma.referral.findFirst({
      where: { refereeId: customerId, shop },
    });

    if (referral) {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT email, "firstName", "lastName" FROM "Wallet" WHERE "customerId" = $1 LIMIT 1`,
        referral.referrerId
      );

      if (rows && rows[0]) {
        if (rows[0].email) referredBy = rows[0].email;
        const parts = [rows[0].firstName, rows[0].lastName].filter(Boolean);
        if (parts.length > 0) referredByName = parts.join(" ");
      }
    }

    return Response.json(
      {
        code: wallet?.referralCode,
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
