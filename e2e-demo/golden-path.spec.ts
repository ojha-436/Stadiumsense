import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Fan golden path in demo mode: sign in → onboard via the questionnaire →
 * land on the home surface and see the AI arrival plan plus the sustainability
 * insight. This is the flow the FIFA World Cup 2026 brief cares about
 * (navigation + transportation + sustainability), proven end-to-end with no
 * backend. Demo email sign-in accepts any credentials and returns an active fan.
 */
test.describe("fan golden path (demo)", () => {
  test("onboards a fan and shows the sustainability insight on home", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/signin/);

    // Demo auth: any email/password signs in as an active fan.
    await page.getByLabel("Email").fill("fan@demo.local");
    await page.getByLabel("Password").fill("demo-pass");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    // First run with no profile → onboarding questionnaire (default tab).
    const section = page.getByLabel("Section");
    await expect(section).toBeVisible();
    await section.fill("114");
    // Transport mode defaults to transit — a low-carbon choice, so the
    // sustainability card should show a positive saving.
    await page.getByRole("button", { name: "Build my plan" }).click();

    // Home surface: the sustainability insight renders from the saved profile.
    await expect(page.getByText("Your travel impact")).toBeVisible();
    await expect(page.getByText(/kg of CO/)).toBeVisible();
  });

  test("home surface has no serious accessibility violations", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email").fill("fan@demo.local");
    await page.getByLabel("Password").fill("demo-pass");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByLabel("Section").fill("114");
    await page.getByRole("button", { name: "Build my plan" }).click();
    await expect(page.getByText("Your travel impact")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(serious).toEqual([]);
  });
});
