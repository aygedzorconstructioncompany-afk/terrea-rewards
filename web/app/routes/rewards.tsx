import { useLoaderData } from "react-router";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  List,
} from "@shopify/polaris";

interface WalletData {
  balance: number;
  transactions: Array<{
    id: string;
    amount: number;
    type: "earn" | "spend";
    description: string;
    createdAt: string;
  }>;
  tier: number;
}

export const loader = async ({ request }: any) => {
  return {
    balance: 850,
    transactions: [
      {
        id: "1",
        amount: 300,
        type: "earn" as const,
        description: "Auto-order #1001",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        amount: 250,
        type: "earn" as const,
        description: "Auto-order #1002",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        amount: 200,
        type: "earn" as const,
        description: "Referral bonus",
        createdAt: new Date().toISOString(),
      },
      {
        id: "4",
        amount: 100,
        type: "spend" as const,
        description: "Order discount",
        createdAt: new Date().toISOString(),
      },
    ],
    tier: 15,
  };
};

export default function RewardsPage() {
  const { balance, transactions, tier } = useLoaderData<WalletData>();

  const getTierBadge = (tierValue: number) => {
    if (tierValue >= 20) return { status: "success" as const, label: "20% Tier (Fixed)" };
    if (tierValue >= 15) return { status: "warning" as const, label: "15% Tier" };
    return { status: "info" as const, label: "10% Tier" };
  };

  const badge = getTierBadge(tier);

  return (
    <Page title="Terrea Wallet - Rewards">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <InlineStack distribute="space-between" align="center">
              <div>
                <Text as="h2" variant="headingLg">
                  💰 Your Points Balance
                </Text>
              </div>
              <Badge status={badge.status}>{badge.label}</Badge>
            </InlineStack>

            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#008000" }}>
              {balance} points
            </div>

            <Text as="p" tone="subdued">
              Worth approximately ₽{(balance * 0.5).toFixed(0)} in discounts
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              📊 Loyalty Tier
            </Text>
            <Text>
              You're earning <strong>{tier}%</strong> cashback on auto-orders
            </Text>
            {tier < 20 && (
              <Text tone="subdued">
                Continue your auto-orders to reach the next tier!
              </Text>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              📝 Transaction History
            </Text>
            {transactions.length === 0 ? (
              <Text tone="subdued">No transactions yet</Text>
            ) : (
              <List>
                {transactions.map((tx) => (
                  <List.Item key={tx.id}>
                    <InlineStack distribute="space-between">
                      <div>
                        <Text>{tx.description}</Text>
                        <Text tone="subdued" size="small">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </Text>
                      </div>
                      <Text
                        weight="semibold"
                        color={tx.type === "earn" ? "success" : "warning"}
                      >
                        {tx.type === "earn" ? "+" : "-"}
                        {tx.amount}
                      </Text>
                    </InlineStack>
                  </List.Item>
                ))}
              </List>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              ℹ️ How It Works
            </Text>
            <List>
              <List.Item>Every auto-order gives you 10% cashback (points)</List.Item>
              <List.Item>After 3 months: upgrade to 15% cashback</List.Item>
              <List.Item>After 6 months: upgrade to 20% cashback (fixed forever)</List.Item>
              <List.Item>Points expire after 6 months</List.Item>
              <List.Item>Use points for up to 50% discount on next order</List.Item>
            </List>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}