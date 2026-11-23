import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`prefers-reduced-motion: ${reducedMotion}`, () => {
    test.use({ reducedMotion });

    test("has no detectable accessibility violations", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
      const violations = results.violations.flatMap((violation) =>
        violation.nodes.map((node) => `${violation.id}: ${node.target.join(" ")}`),
      );
      expect(violations).toEqual([]);
    });
  });
}

test("is readable with motion turned off", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // The hero is one screen tall and nothing waits on scroll to become visible.
  const heroHeight = await page.locator("[data-hero]").evaluate((el) => el.clientHeight);
  expect(heroHeight).toBeLessThanOrEqual((page.viewportSize()?.height ?? 0) + 1);
  for (const word of await page.locator("[data-word]").all()) {
    await expect(word).toHaveCSS("color", "rgb(244, 241, 250)");
  }
});

test("is readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Caden");
  await expect(page.getByRole("heading", { name: "Experience" })).toBeVisible();
  await expect(page.locator("[data-card]").first()).toBeVisible();
  await context.close();
});

test("can be used from the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#intro$/);
});

test("has one h1 and headings in order", async ({ page }) => {
  await page.goto("/");
  const levels = await page
    .locator("h1, h2, h3")
    .evaluateAll((headings) => headings.map((heading) => Number(heading.tagName[1])));
  expect(levels.filter((level) => level === 1)).toHaveLength(1);
  levels.reduce((previous, level) => {
    expect(level - previous).toBeLessThanOrEqual(1);
    return level;
  }, 0);
});
