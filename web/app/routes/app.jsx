import { Outlet } from "@remix-run/react";
import { AppProvider } from "@shopify/polaris";
import { NavMenu } from "@shopify/app-bridge-react";
import "@shopify/polaris/build/esm/styles.css";

export default function App() {
  return (
    <AppProvider>
      {/* Меню в Shopify */}
      <NavMenu>
        <a href="/app">Dashboard</a>
        <a href="/app/rewards">Rewards</a>
      </NavMenu>

      {/* Контент страниц */}
      <Outlet />
    </AppProvider>
  );
}