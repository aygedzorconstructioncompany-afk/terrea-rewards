import prisma from "../db.server";

export async function action({ request }: any) {
  try {
    const { secret } = await request.json();
    if (secret !== "terrea-admin-2024") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    await prisma.pointsTransaction.deleteMany({});
    await prisma.referral.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.subscription.deleteMany({});

    return new Response(JSON.stringify({ success: true, message: "Database cleared!" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
