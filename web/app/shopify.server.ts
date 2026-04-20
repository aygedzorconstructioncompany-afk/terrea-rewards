// DEMO MODE — БЕЗ SHOPIFY И БЕЗ OAUTH
export const authenticate = {
  admin: async () => ({
    session: {
      shop: process.env.SHOPIFY_SHOP_DOMAIN || "terrea-home-rituals.myshopify.com",
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN || "demo",
    },
    admin: {
      graphql: async () => ({}),
      rest: {},
    },
  }),
};
// заглушки чтобы ничего не падало
export const unauthenticated = async () => ({});
export const login = async () => ({});
export const registerWebhooks = async () => ({});
export const addDocumentResponseHeaders = () => ({});
