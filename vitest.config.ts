import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/types.ts",
        "src/i18n/locales/**",
      ],
      // Enforce coverage on the pure business-logic modules we unit-test (the
      // presentational/screen layer is exercised by the demo-mode Playwright
      // golden path instead). Floors sit just under current actuals so a genuine
      // regression fails CI, but ordinary refactors don't. Per-glob so untested
      // UI is never silently counted as "covered".
      thresholds: {
        "src/features/auth/roles.ts": { statements: 100, branches: 100, functions: 100, lines: 100 },
        "src/lib/logger.ts": { statements: 100, branches: 90, functions: 100, lines: 100 },
        "src/lib/format.ts": { statements: 95, branches: 95, functions: 100, lines: 95 },
        "src/features/fan/sustainability.ts": { statements: 90, branches: 80, functions: 100, lines: 90 },
        "src/features/fan/food/useCart.ts": { statements: 90, branches: 80, functions: 100, lines: 90 },
      },
    },
  },
});
