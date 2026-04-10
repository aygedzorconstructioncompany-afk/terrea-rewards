import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  console.log("App uninstalled");
  return new Response("OK", { status: 200 });
}
