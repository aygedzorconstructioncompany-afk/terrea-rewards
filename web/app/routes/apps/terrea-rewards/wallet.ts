import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 👉 GET /api/wallet
export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);

    const customerIdParam =
      url.searchParams.get("logged_in_customer_id") ||
      url.searchParams.get("customerId") ||
      url.searchParams.get("customer_id"); // 👈 App Proxy

    if (!customerIdParam) {
      return json(
        { points: 0, transactions: [] },
        { headers: corsHeaders }
      );
    }

    const customerId = String(customerIdParam);

    let wallet = await prisma.wallet.findUnique({
      where: { customerId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          customerId,
          balance: 0,
        },
        include: {
          transactions: true,
        },
      });
    }

    return json(
      {
        points: wallet.balance ?? 0,
        transactions: wallet.transactions ?? [],
      },
      { headers: corsHeaders }
    );

  } catch (e) {
    console.error("WALLET ERROR:", e);

    return json(
      { points: 0, transactions: [] },
      { headers: corsHeaders }
    );
  }
}

// 👉 POST /api/wallet (начисление баллов)
export async function action({ request }: ActionFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { customerId, points } = body;

    if (!customerId) {
      return json(
        { success: false },
        { headers: corsHeaders }
      );
    }

    let wallet = await prisma.wallet.findUnique({
      where: { customerId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          customerId,
          balance: 0,
        },
      });
    }

    const updated = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: points || 0,
        },
      },
    });

    // 👉 добавляем транзакцию
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount: points || 0,
        type: "earn",
        description: "Manual add",
      },
    });

    return json(
      {
        success: true,
        points: updated.balance,
      },
      { headers: corsHeaders }
    );

  } catch (e) {
    console.error("ADD ERROR:", e);

    return json(
      { success: false },
      { headers: corsHeaders }
    );
  }
}