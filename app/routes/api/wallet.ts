import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";

// 👉 GET /api/wallet
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);

    console.log("🔥 PROXY HIT");
    console.log("QUERY:", url.searchParams.toString());

    return new Response(
      JSON.stringify({
        ok: true,
        points: 123,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    console.error("ERROR:", e);

    return new Response(
      JSON.stringify({ ok: false }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// 👉 POST /api/wallet
export async function action({ request }: ActionFunctionArgs) {
  return new Response(
    JSON.stringify({ ok: true }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}