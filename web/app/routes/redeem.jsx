import { useState } from "react";
import {
  Card,
  Button,
  TextField,
  Text,
  BlockStack,
  InlineStack,
  Banner,
} from "@shopify/polaris";

export default function Redeem() {
  const [points, setPoints] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRedeem() {
    setError("");
    setSuccess("");

    if (!points || !customerId) {
      setError("Fill all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          points: Number(points),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data?.error?.[0]?.message || "Something went wrong"
        );
        return;
      }

      setSuccess(`Discount created: ${data.code}`);

      // 🔥 редирект на checkout с кодом
      window.location.href = `/discount/${data.code}`;

    } catch (e) {
      console.error(e);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <BlockStack gap="400">

        <Text variant="headingMd">Redeem Points</Text>

        {error && (
          <Banner status="critical">
            {error}
          </Banner>
        )}

        {success && (
          <Banner status="success">
            {success}
          </Banner>
        )}

        <TextField
          label="Customer ID (gid://...)"
          value={customerId}
          onChange={setCustomerId}
          autoComplete="off"
        />

        <TextField
          label="Points"
          type="number"
          value={points}
          onChange={setPoints}
          autoComplete="off"
        />

        <InlineStack>
          <Button
            variant="primary"
            loading={loading}
            onClick={handleRedeem}
          >
            Redeem
          </Button>
        </InlineStack>

      </BlockStack>
    </Card>
  );
}