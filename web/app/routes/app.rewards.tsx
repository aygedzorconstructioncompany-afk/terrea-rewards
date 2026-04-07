import { useEffect, useState } from "react";
import {
  Page,
  Card,
  Text,
  Layout,
  Button,
  Badge,
} from "@shopify/polaris";
import type { Route } from "react-router";

export const loader = async ({ request }: Route.LoaderArgs) => {
  return { initialPoints: 0 };
};

export default function RewardsPage() {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  // 👉 позже заменим на реальный Shopify ID
  const customerId = "demo-user";

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    try {
      const res = await fetch(`/api/wallet?customerId=${customerId}`);
      const data = await res.json();

      setPoints(Number(data.points) || 0);
    } catch (e) {
      console.error("LOAD ERROR:", e);
      setPoints(0);
    }
  }

  async function addPoints() {
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          points: 100,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPoints(data.balance);
      }
    } catch (e) {
      console.error("ADD ERROR:", e);
    } finally {
      setLoading(false);
    }
  }

  async function redeem(cost: number) {
    if (loading || points < cost) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          points: -cost,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPoints(data.balance);
        alert("Reward redeemed!");
      }
    } catch (e) {
      console.error("REDEEM ERROR:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Terrea Rewards">
      <Layout>

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingLg">Points Balance</Text>

              <div style={{ fontSize: "40px", fontWeight: "bold", marginTop: "10px" }}>
                ⭐ {points} pts
              </div>

              <div style={{ marginTop: "10px" }}>
                <Badge tone="success">Gold Member</Badge>
              </div>

              <div style={{ marginTop: "15px" }}>
                <Button onClick={addPoints} loading={loading}>
                  Add 100 points (DEMO)
                </Button>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingLg">Rewards</Text>

              <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
                
                <Card>
                  <div style={{ padding: "15px" }}>
                    <Text variant="headingMd">$5 Discount</Text>
                    <Text>500 points</Text>
                    <Button
                      disabled={points < 500 || loading}
                      onClick={() => redeem(500)}
                    >
                      Redeem
                    </Button>
                  </div>
                </Card>

                <Card>
                  <div style={{ padding: "15px" }}>
                    <Text variant="headingMd">$10 Discount</Text>
                    <Text>1000 points</Text>
                    <Button
                      disabled={points < 1000 || loading}
                      onClick={() => redeem(1000)}
                    >
                      Redeem
                    </Button>
                  </div>
                </Card>

              </div>
            </div>
          </Card>
        </Layout.Section>

      </Layout>
    </Page>
  );
}