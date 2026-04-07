import { type RouteConfig, route } from "@react-router/dev/routes";
export default [
  route("/app/rewards", "./routes/app.rewards.jsx"),
  route("/api/redeem", "./routes/api.redeem.jsx"),
  route("/api/balance", "./routes/api.balance.ts"),
  route("/api/wallet", "./routes/api.wallet.ts"),
  route("/api/proxy/wallet", "./routes/api.proxy.wallet.ts"),
  route("/api/order", "./routes/api.order.ts"),
  route("/api/referral/generate", "./routes/api.referral.generate.ts"),
  route("/api/referral/apply", "./routes/api.referral.apply.ts"),
  route("/webhooks/orders/create", "./routes/webhooks.orders.create.ts"),
  route("/api/subscription", "./routes/api.subscription.ts"),
  route("/api/points/expire", "./routes/api.points.expire.ts"),
  route("/api/points/transfer", "./routes/api.points.transfer.ts"),
  route("/api/points/checkout", "./routes/api.points.checkout.ts"),
] satisfies RouteConfig;