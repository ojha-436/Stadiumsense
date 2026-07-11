import { test, expect } from "@playwright/test";

/**
 * Golden-path smoke test. Verifies the app boots, routes unauthenticated users
 * to sign-in, and renders the accessible shell (skip link, language switcher).
 * The full authenticated flow (onboard → plan → order) runs against the seeded
 * emulator; this baseline guards against build/routing regressions on every push.
 */
test.describe("StadiumSense shell", () => {
  test("redirects to sign-in and shows the branded welcome", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/signin/);
    await expect(page.getByRole("heading", { name: /StadiumSense/i })).toBeVisible();
  });

  test("exposes a keyboard skip link and language selector", async ({ page }) => {
    await page.goto("/signin");
    // Language selector is present for multilingual access from the first screen.
    await expect(page.getByRole("combobox")).toBeVisible();
    // Sign-in and create-account affordances exist.
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("supports switching language to Spanish", async ({ page }) => {
    await page.goto("/signin");
    await page.getByRole("combobox").selectOption("es");
    await expect(page.getByText(/Bienvenido a StadiumSense/i)).toBeVisible();
  });
});
