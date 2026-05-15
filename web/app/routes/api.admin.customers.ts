import prisma from "../db.server";
const corsHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});
async function getCustomerEmail(customerId: string): Promise<string> {
  try {
    const shop = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    console.log("Token exists:", !!token);
    console.log("Fetching customer:", customerId);

    const query = `{
      customer(id: "gid://shopify/Customer/${customerId}") {
        email
      }
    }`;

    const res = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": token!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    console.log("Shopify status:", res.status);
    const data = await res.json();
    console.log("GraphQL response:", JSON.stringify(data));
    return data.data?.customer?.email || "";
  } catch (e) {
    console.error("getCustomerEmail error:", e);
    return "";
  }
}
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
    const customers = await Promise.all(wallets.map(async w => {
      const email = await getCustomerEmail(w.customerId);
      return {
        customerId: w.customerId,
        email,
        balance: w.balance,
        tier: w.tier,
        totalSpent: w.totalSpent,
        monthsActive: subMap[w.customerId]?.monthsActive || 0,
        status: subMap[w.customerId]?.status || "none",
        lastTransaction: w.transactions[0]?.createdAt || null,
      };
    }));
    return new Response(JSON.stringify({ success: true, customers, total: customers.length }), {
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
