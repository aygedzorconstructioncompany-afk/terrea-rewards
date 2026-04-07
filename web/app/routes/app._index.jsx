import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Badge,
  ProgressBar,
  Divider,
} from "@shopify/polaris";
import { useState } from "react";

export default function PremiumUI() {
  const [loading, setLoading] = useState(false);

  const points = 1200;
  const nextTier = 2000;
  const progress = (points / nextTier) * 100;

  async function redeem(pointsToUse) {
    setLoading(true);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: "gid://shopify/Customer/123",
          points: pointsToUse,
        }),
      });

      const data = await res.json();

      if (data.code) {
        window.location.href = `/discount/${data.code}`;
      } else {
        alert("Redeem success (no redirect yet)");
      }
    } catch (e) {
      console.error(e);
      alert("Redeem failed");
    }

    setLoading(false);
  }

  return (
    <Page fullWidth>
      {/* HERO */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          borderRadius: 20,
          padding: 30,
          color: "white",
          marginBottom: 20,
        }}
      >
        <BlockStack gap="300">
          <Text variant="headingLg">Terrea Rewards</Text>

          <InlineStack align="space-between">
            <BlockStack>
              <Text variant="heading2xl">{points} pts</Text>
              <Text tone="subdued">Available balance</Text>
            </BlockStack>

            <Badge tone="success">Gold Member</Badge>
          </InlineStack>

          <BlockStack>
            <Text tone="subdued">
              Progress to Platinum ({nextTier} pts)
            </Text>
            <ProgressBar progress={progress} size="small" />
          </BlockStack>
        </BlockStack>
      </div>

      <BlockStack gap="500">
        {/* REDEEM */}
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd">Redeem Rewards</Text>

            <InlineStack gap="300">
              {[
                { pts: 100, value: "$1" },
                { pts: 500, value: "$5" },
                { pts: 1000, value: "$10" },
              ].map((r) => (
                <div
                  key={r.pts}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 20,
                    width: 180,
                    textAlign: "center",
                  }}
                >
                  <BlockStack gap="200">
                    <Text variant="headingMd">{r.value}</Text>
                    <Text tone="subdued">{r.pts} pts</Text>

                    <Button
                      variant={r.pts === 1000 ? "primary" : "secondary"}
                      onClick={() => redeem(r.pts)}
                      loading={loading}
                    >
                      Redeem
                    </Button>
                  </BlockStack>
                </div>
              ))}
            </InlineStack>
          </BlockStack>
        </Card>

        {/* TIERS */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">Membership Tiers</Text>

            <InlineStack gap="200">
              <Badge>Silver</Badge>
              <Badge tone="success">Gold</Badge>
              <Badge tone="attention">Platinum</Badge>
            </InlineStack>

            <Text tone="subdued">
              Higher tiers unlock better rewards and cashback.
            </Text>
          </BlockStack>
        </Card>

        {/* ACTIVITY */}
        <Card>
          <BlockStack gap="200">
            <Text variant="headingMd">Recent Activity</Text>
            <Divider />

            <InlineStack align="space-between">
              <Text>+200 pts — Order #1234</Text>
              <Text tone="subdued">Today</Text>
            </InlineStack>

            <InlineStack align="space-between">
              <Text>-100 pts — Redeemed</Text>
              <Text tone="subdued">Yesterday</Text>
            </InlineStack>

            <InlineStack align="space-between">
              <Text>+500 pts — Subscription</Text>
              <Text tone="subdued">2 days ago</Text>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}