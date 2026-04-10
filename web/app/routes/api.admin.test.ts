import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

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

  try {
    await prisma.subscription.updateMany({
      where: { customerId: email },
      data: { startedAt: date, monthsActive: months }
    });

    const sub = await prisma.subscription.findFirst({
      where: { customerId: email }
    });

    return new Response(JSON.stringify({ success: true, email, months, sub }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
