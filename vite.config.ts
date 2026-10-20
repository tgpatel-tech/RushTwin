import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => ({
  base: mode === "github" ? "/RushTwin/" : "/",
  plugins: [react(), tailwindcss()],
  test: { environment: "jsdom", include: ["src/**/*.test.{ts,tsx}"] },
}));
