import { defineConfig, devices } from "@playwright/test";

/**
 * Hermetic demo-mode E2E. Builds and serves the app with `--mode demo` (offline:
 * in-memory store, mocked auth, client-side fake Gemini gateway — no Firebase, no
 * billing) and drives the real fan golden path end-to-end. Kept separate from the
 * emulator-backed `playwright.config.ts` so neither disturbs the other.
 */
export default defineConfig({
  testDir: "./e2e-demo",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview:demo",
    url: "http://127.0.0.1:4173",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
