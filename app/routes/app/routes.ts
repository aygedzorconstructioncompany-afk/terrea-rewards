import { type RouteConfig, index, route } from "@remix-run/route-config";

export default [
  index("routes/app._index.tsx"),

  route("app/rewards", "routes/app/rewards.tsx"),
  route("app/test", "routes/app/test.tsx"),
] satisfies RouteConfig;