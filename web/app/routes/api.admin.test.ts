import type { LoaderFunctionArgs } from "react-router";
import db from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const months = parseInt(url.searchParams.get("months") || "0");
  const secret = url.searchParams.get("secret");

  if (secret !== "terrea-admin-2024") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (!email || !months) {
    return new Response(JSON.stringify({ error: "email and months required" }), { status: 400 });
  }

  const date = new Date();
  date.setMonth(date.getMonth() - months);

  await db.customer.updateMany({
    where: { email },
    data: { subscriptionStartDate: date, monthsActive: months }
  });

  const customer = await db.customer.findFirst({ where: { email } });

  return new Response(JSON.stringify({ success: true, email, months, customer }), {
    headers: { "Content-Type": "application/json" }
  });
}
