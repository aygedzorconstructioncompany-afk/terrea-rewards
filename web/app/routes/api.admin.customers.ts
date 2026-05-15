import prisma from "../db.server";
const corsHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

export async function loader({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
  if (secret !== "terrea-admin-2024") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  try {
    const wallets = await prisma.wallet.findMany({
      where: { shop },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { balance: "desc" },
    });
    const subs = await prisma.subscription.findMany({ where: { shop } });
    const subMap = Object.fromEntries(subs.map(s => [s.customerId, s]));
    const customers = wallets.map(w => ({
      customerId: w.customerId,
      email: w.email || "",  // ✅ берём из базы
      balance: w.balance,
      tier: w.tier,
      totalSpent: w.totalSpent,
      monthsActive: subMap[w.customerId]?.monthsActive || 0,
      status: subMap[w.customerId]?.status || "none",
      lastTransaction: w.transactions[0]?.createdAt || null,
    }));
    return new Response(JSON.stringify({ success: true, customers, total: customers.length }), {
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
