import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  console.log("Order paid webhook received");
  return new Response("OK", { status: 200 });
}
