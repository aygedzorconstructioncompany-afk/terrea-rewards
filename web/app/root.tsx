import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";

export function headers() {
  return {
    "Content-Security-Policy": "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
  };
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function App() {
  return (
    <html suppressHydrationWarning>
      <head>
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <AppProvider i18n={{}}>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
