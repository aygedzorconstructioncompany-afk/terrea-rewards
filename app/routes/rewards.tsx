import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  BlockStack,
} from "@shopify/polaris";

export const loader = async () => {
  return json({
    points: 123,
  });
};

export default function RewardsPage() {
  const { points } = useLoaderData<typeof loader>();

  return (
    <Page title="Rewards">
      <Card>
        <BlockStack gap="200">
          <Text as="h2" variant="headingLg">
            Your Points
          </Text>

          <Text as="p" variant="heading2xl">
            {points}
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
