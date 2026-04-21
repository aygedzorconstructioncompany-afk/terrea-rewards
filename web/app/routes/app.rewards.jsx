import { useEffect, useState, useCallback } from "react";
import {
  Page,
  Card,
  Text,
  Button,
  Banner,
  BlockStack,
  InlineStack
} from "@shopify/polaris";

export const ssr = false;

export default function RewardsPage() {
  const [currentBalance, setCurrentBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(null);

  const loadData = useCallback(async () => {
    try {
     const shop = "terrea-home-rituals.myshopify.com";
const customerId = window.customerId || "demo-user-1";
const res = await fetch(`/api/balance?customer_id=${customerId}&shop=${shop}`);
      const data = await res.json();
      setCurrentBalance(data.balance || 0);
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error("Load error:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRedeem = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: window.customerId || "demo",
          points: 500,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }
      alert("🎉 Ваш код скидки: " + data.code + "\n\nСкопируйте и используйте при оформлении заказа!");
      setCode(data.code);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Error");
    }
    setLoading(false);
  };

  return (
    <Page title="Terrea Rewards">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <Text variant="headingMd">Your Balance</Text>
            <Text variant="heading2xl">{currentBalance} pts</Text>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">Redeem Rewards</Text>
            <Button
              variant="primary"
              size="large"
              loading={loading}
              onClick={handleRedeem}
              disabled={currentBalance < 500}
            >
              Redeem 500 pts → Get Discount
            </Button>
            {currentBalance < 500 && (
              <Text tone="critical">Not enough points</Text>
            )}
          </BlockStack>
        </Card>

        {code && (
          <Banner tone="success" title="🎉 Reward Ready!">
            <BlockStack gap="200">
              <Text>Your discount code:</Text>
              <InlineStack gap="200">
                <Text variant="headingLg">{code}</Text>
                <Button onClick={() => navigator.clipboard.writeText(code)}>
                  Copy
                </Button>
              </InlineStack>
              <Button
                variant="primary"
                onClick={() =>
                  (window.top.location.href =
                    "https://terrea-home-rituals.myshopify.com/discount/" + code)
                }
              >
                Apply & Checkout
              </Button>
            </BlockStack>
          </Banner>
        )}

        <Card>
          <BlockStack gap="200">
            <Text variant="headingMd">Activity</Text>
            {transactions.length === 0 && <Text>No activity yet</Text>}
            {transactions.map((t) => (
              <InlineStack key={t.id} gap="200" align="space-between">
                <Text>{t.description || t.type}</Text>
                <Text tone={t.amount > 0 ? "success" : "critical"}>
                  {t.amount > 0 ? "+" : ""}{t.amount} pts
                </Text>
              </InlineStack>
            ))}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
