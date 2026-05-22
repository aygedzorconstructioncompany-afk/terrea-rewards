import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import prisma from "../../../db.server";
import { authenticate } from "../../../shopify.server";

// BACKEND
export const loader = async ({ request }) => {
  await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customerId");

  const shop = request.headers.get("x-shopify-shop-domain");

  const wallet = await prisma.wallet.findFirst({
    where: { customerId: String(customerId) }
  });

  const subscription = await prisma.subscription.findFirst({
    where: {
      customerId: String(customerId),
      shop
    }
  });

  return json({
    points: wallet?.balance ?? 0,
    subscription,
    customerId
  });
};

// UI
export default function WalletPage() {
  const { points, subscription, customerId } = useLoaderData();

  const status = subscription?.status;

  const getDaysLeft = () => {
    if (!subscription?.nextChargeDate) return null;
    const diff =
      new Date(subscription.nextChargeDate).getTime() - Date.now();
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
  };

  const daysLeft = getDaysLeft();

  const handleAction = async (type) => {
    await fetch("/api/subscription/manage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customer_id: customerId,   // 🔥 исправлено
        action: type               // 🔥 исправлено
      })
    });

    window.location.reload();
  };

  return (
    <div style={{ padding: 30, fontFamily: "sans-serif" }}>
      <h1>Terrea Rewards</h1>
      <p>Points: <strong>{points}</strong></p>

      <div
        style={{
          marginTop: 20,
          padding: 20,
          borderRadius: 12,
          background:
            status === "active"
              ? "#d4edda"
              : status === "paused"
              ? "#fff3cd"
              : status === "canceled"
              ? "#f8d7da"
              : "#eee"
        }}
      >
        <h2>
          {status === "active" && "🟢 Active subscription"}
          {status === "paused" && "🟡 Paused subscription"}
          {status === "canceled" && "🔴 Subscription canceled"}
          {!status && "⚪ No subscription"}
        </h2>

        {status === "active" && (
          <p>Next charge in: <strong>{daysLeft} days</strong></p>
        )}

        {status === "paused" && (
          <p>Paused. Remaining: {subscription?.daysLeft ?? 0} days</p>
        )}

        <div style={{ marginTop: 15 }}>
          {status === "active" && (
            <>
              <button onClick={() => handleAction("pause")}>Pause</button>
              <button onClick={() => handleAction("cancel")}>Cancel</button>
            </>
          )}

          {status === "paused" && (
            <button onClick={() => handleAction("resume")}>
              Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
