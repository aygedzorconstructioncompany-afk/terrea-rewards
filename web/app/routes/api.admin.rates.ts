import prisma from "../db.server";

const RATES_KEY = "cashback_rates";

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== "terrea-admin-2024") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: RATES_KEY },
    });

    const rates = setting ? JSON.parse(setting.value) : {
      start: 10,
      stay: 15,
      belong: 20,
      "belong+": 20,
    };

    return new Response(JSON.stringify({ success: true, rates }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function action({ request }: any) {
  try {
    const { secret, rates } = await request.json();

    if (secret !== "terrea-admin-2024") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    await prisma.setting.upsert({
      where: { key: RATES_KEY },
      create: { key: RATES_KEY, value: JSON.stringify(rates) },
      update: { value: JSON.stringify(rates) },
    });

    return new Response(JSON.stringify({ success: true, rates }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
