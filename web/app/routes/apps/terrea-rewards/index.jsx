import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import prisma from "../../../db.server";
import { authenticate } from "../../../shopify.server";

// ✅ BACKEND
export const loader = async ({ request }) => {
  try {
    await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");

    if (!customerId) {
      return json({ points: 0 });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { customerId: String(customerId) }
    });

    return json({
      points: wallet?.balance ?? 0
    });

  } catch (error) {
    console.error("Proxy loader error:", error);
    return json({ points: 0 });
  }
};

// ✅ UI (ВОТ ЧЕГО НЕ ХВАТАЛО)
export default function WalletPage() {
  const { points } = useLoaderData();

  return (
    <div style={{ padding: 20 }}>
      <h1>Terrea Wallet</h1>
      <p>Points: {points}</p>
    </div>
  );
}