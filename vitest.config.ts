import "dotenv/config";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", "coverage/**", "dist/**"],
    environment: "node",
    env: {
      AGENT_PROVIDER: "mock",
      AGENT_MODEL: "mock-conservation-agent",
    },
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
});
