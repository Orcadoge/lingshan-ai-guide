import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    exclude: [
      "tests/**",
      "playwright.config.ts",
      "node_modules/**",
      ".next/**",
      "dist/**",
    ],
  },
});
