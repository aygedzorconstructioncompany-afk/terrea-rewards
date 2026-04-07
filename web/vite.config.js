import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 58615,
    allowedHosts: true,
    cors: true,
  },
  plugins: [
    reactRouter(),
    tsconfigPaths(),
  ],
});