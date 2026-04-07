import { json } from "@remix-run/node";

export async function loader({ request }) {
  return json({
    points: 120,
    customerId: "demo-user",
  });
}