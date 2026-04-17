import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

const SHOP = "terrea-dev-store.myshopify.com";
const BASE_URL = "https://terrea-rewards-1.onrender.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function registerWebhooks() {
  const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
  const API_URL = `https://${SHOP}/admin/api/2024-01/graphql.json`;

  const WEBHOOKS = [
    // ✅ Главный — начисление кэшбэка при каждом оплаченном заказе
    { topic: "ORDERS_PAID", endpoint: "/webhooks/orders/paid" },

    // Подписки
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
              webhookSubscription { id callbackUrl topic }
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
    const result = data?.data?.webhookSubscriptionCreate;
    const errors = result?.userErrors || [];

    results.push({
      topic: wh.topic,
      endpoint: BASE_URL + wh.endpoint,
      success: errors.length === 0,
      id: result?.webhookSubscription?.id || null,
      errors,
    });

    console.log(`[webhook register] ${wh.topic}: ${errors.length === 0 ? "✅ OK" : "❌ " + JSON.stringify(errors)}`);
  }

  return results;
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Только с секретом
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET && secret !== "terrea-admin-2024") {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await registerWebhooks();
  return new Response(JSON.stringify({ success: true, results }, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const results = await registerWebhooks();
  return new Response(JSON.stringify({ success: true, results }, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
