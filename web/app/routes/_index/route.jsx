import { AppProvider } from "@shopify/polaris";
import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
export const loader = async ({ request }) => {
  const result = await login(request);
  return { errors: result || {} };
};
export const action = async ({ request }) => {
  const result = await login(request);
  return { errors: result || {} };
};
export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;
  return (
    <AppProvider>
      <div style={{ padding: 20 }}>
        <Form method="post">
          <h2>Log in</h2>
          <input
            name="shop"
            placeholder="example.myshopify.com"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            style={{ padding: 8, width: 300 }}
          />
          {errors?.shop && (
            <div style={{ color: "red" }}>{errors.shop}</div>
          )}
          <br /><br />
          <button type="submit">Log in</button>
        </Form>
      </div>
    </AppProvider>
  );
}
