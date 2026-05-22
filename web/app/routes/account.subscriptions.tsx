import { useEffect, useState } from "react";
import type { Route } from "react-router";
import prisma from "../db.server";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  
  if (!customerId) {
    return { subscriptions: [], error: "No customer" };
  }

  try {
    const subs = await prisma.subscription.findMany({
      where: { customerId: String(customerId) }
    });
    return { subscriptions: subs };
  } catch (e) {
    return { subscriptions: [], error: "Error loading subscriptions" };
  }
};

export default function SubscriptionsPage({ loaderData }: Route.ComponentProps) {
  const { subscriptions } = loaderData;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>My Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <p>No active subscriptions</p>
      ) : (
        subscriptions.map((sub: any) => (
          <div
            key={sub.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px",
              backgroundColor: "#fff"
            }}
          >
            <div style={{ display: "flex", gap: "20px" }}>
              {/* ФОТО ТОВАРА */}
              {sub.productImage && (
                <div>
                  <img
                    src={sub.productImage}
                    alt={sub.productTitle}
                    style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "8px" }}
                  />
                </div>
              )}

              {/* ИНФОРМАЦИЯ О ТОВАРЕ И ПОДПИСКЕ */}
              <div style={{ flex: 1 }}>
                <h2>{sub.productTitle || "Product"}</h2>
                {sub.productPrice && (
                  <p><strong>Price:</strong> £{sub.productPrice}</p>
                )}
                <p><strong>Status:</strong> {sub.status}</p>
                <p><strong>Next delivery:</strong> {new Date(sub.nextChargeDate).toLocaleDateString()}</p>
                <p><strong>Tier:</strong> {sub.currentTier}</p>
                <p><strong>Months active:</strong> {sub.monthsActive}</p>

                {/* КНОПКИ */}
                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                  <button
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#000",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Pause
                  </button>
                  <button
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#f0f0f0",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
