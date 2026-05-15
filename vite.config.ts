import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { version } from "./package.json";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 15000,
  },
});