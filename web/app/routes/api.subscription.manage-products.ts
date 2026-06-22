// web/app/routes/api.subscription.manage-products.ts
// Маршруты: POST /api/subscription/add-product
//           POST /api/subscription/remove-product

import type { Route } from "./+types/api.subscription.manage-products";
import { addProduct, removeProduct } from "./api.subscription.add-product";

function cors(resp: Response) {
  resp.headers.set("Access-Control-Allow-Origin", "*");
  resp.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  resp.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return resp;
}

export async function action({ request }: Route.ActionArgs) {
  // CORS preflight
  if (request.method === "OPTIONS") {
    return cors(new Response(null, { status: 204 }));
  }

  if (request.method !== "POST") {
    return cors(Response.json({ error: "Method not allowed" }, { status: 405 }));
  }

  const url = new URL(request.url);
  const path = url.pathname;

  let body: { email?: string; variantId?: string; quantity?: number } = {};
  try {
    body = await request.json();
  } catch {
    return cors(Response.json({ error: "Invalid JSON" }, { status: 400 }));
  }

  const { email, variantId, quantity = 1 } = body;

  if (!email || !variantId) {
    return cors(
      Response.json({ error: "email and variantId are required" }, { status: 400 })
    );
  }

  try {
    if (path.endsWith("add-product")) {
      const result = await addProduct(email, variantId, Number(quantity));
      return cors(Response.json(result));
    }

    if (path.endsWith("remove-product")) {
      const result = await removeProduct(email, variantId);
      return cors(Response.json(result));
    }

    return cors(Response.json({ error: "Unknown endpoint" }, { status: 404 }));
  } catch (err) {
    console.error("Subscription manage-products error:", err);
    return cors(Response.json({ error: "Server error" }, { status: 500 }));
  }
}

// OPTIONS для CORS preflight
export async function loader({ request }: Route.LoaderArgs) {
  if (request.method === "OPTIONS") {
    return cors(new Response(null, { status: 204 }));
  }
  return cors(Response.json({ error: "Not found" }, { status: 404 }));
}
