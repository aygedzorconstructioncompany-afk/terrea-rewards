import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("api/wallet", "./routes/api/wallet.ts"),
] satisfies RouteConfig;