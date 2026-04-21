import prisma from "../db.server";

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (secret !== "terrea-admin-2024") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const shop = process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com";
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  const wallets = await prisma.wallet.findMany({
    where: { shop, email: null },
    take: 50,
  });

  let updated = 0;
  for (const w of wallets) {
    try {
      const res = await fetch(`https://${shop}/admin/api/2024-01/customers/${w.customerId}.json`, {
        headers: { "X-Shopify-Access-Token": token! },
      });
      const data = await res.json();
      const email = data.customer?.email || "";
      if (email) {
        await prisma.wallet.update({
          where: { id: w.id },
          data: { email },
        });
        updated++;
      }
    } catch {}
  }

  const remaining = await prisma.wallet.count({
    where: { shop, email: null },
  });

  return new Response(JSON.stringify({ success: true, updated, remaining }), {
    headers: { "Content-Type": "application/json" },
  });
}
