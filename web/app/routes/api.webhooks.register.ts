import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

const SHOP = "terrea-dev-store.myshopify.com";
const BASE_URL = "https://terrea-rewards-1.onrender.com";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({ ok: true });
}

export async function action({ request }: ActionFunctionArgs) {
  const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
  const API_URL = `https://${SHOP}/admin/api/2024-01/graphql.json`;

  const WEBHOOKS = [
    { topic: "SUBSCRIPTION_CONTRACTS_CREATE", endpoint: "/webhooks/subscriptions/create" },
    { topic: "SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS", endpoint: "/webhooks/subscriptions/billing" },
  ];

  const results = [];
  for (const wh of WEBHOOKS) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({
        query: `
          mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
            webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
              webhookSubscription { id }
              userErrors { field message }
            }
          }
        `,
        variables: {
          topic: wh.topic,
          webhookSubscription: {
            callbackUrl: BASE_URL + wh.endpoint,
            format: "JSON",
          },
        },
      }),
    });
    const data = await res.json();
    results.push({ topic: wh.topic, result: data });
  }

  return json({ success: true, results });
}
