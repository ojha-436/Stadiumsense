import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated WCAG 2.1 A/AA scan of the first screen every user meets. Backs the
 * accessibility claims in the README with an executable check rather than intent.
 */
test.describe("accessibility (demo)", () => {
  test("sign-in screen has no serious/critical axe violations", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(serious).toEqual([]);
  });
});
