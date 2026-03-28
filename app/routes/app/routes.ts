import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", "routes/index.tsx"),

  route("/app", "routes/app._index.tsx"),
  route("/app/rewards", "routes/app/rewards.tsx"),
  route("/test", "routes/app/test.tsx"),
];