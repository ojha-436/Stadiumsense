import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. The golden-path spec runs against a locally served production
 * build with emulators + seed data. In CI we start the emulator suite, seed,
 * build, and preview before invoking Playwright (see .github/workflows/ci.yml).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
