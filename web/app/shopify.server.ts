// DEMO MODE — БЕЗ SHOPIFY И БЕЗ OAUTH

export const authenticate = {
  admin: async () => ({
    session: {
      shop: "terrea-dev-store.myshopify.com",
      accessToken: "demo",
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