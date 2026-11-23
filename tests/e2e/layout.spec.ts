import { expect, type Page, test } from "@playwright/test";

/**
 * Scrolls the whole page at phone, tablet and desktop sizes and fails if any
 * text is clipped or runs off screen, or if hovering anything moves the layout.
 */

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "phone", width: 390, height: 844 },
];

/** Runs in the page. Returns a description of each piece of visible text that is cut off. */
function findClippedText(): string[] {
  const problems = new Set<string>();
  const viewportWidth = window.innerWidth;
  const label = (element: Element) =>
    `<${element.tagName.toLowerCase()}> "${(element.textContent ?? "").trim().slice(0, 30)}"`;

  if (document.documentElement.scrollWidth > viewportWidth + 1) {
    problems.add(`page scrolls sideways (${document.documentElement.scrollWidth}px wide)`);
  }

  // The hero name is meant to scale past the screen during the zoom.
  const candidates = document.querySelectorAll("main *, footer *, [data-hero-meta] *");
  for (const element of candidates) {
    const hasOwnText = [...element.childNodes].some(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    );
    if (!hasOwnText || element.closest(".visually-hidden")) continue;
    const style = getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none") continue;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.bottom < 0 || rect.top > window.innerHeight) continue;
    if (rect.right > viewportWidth + 1 || rect.left < -1) {
      problems.add(`off screen: ${label(element)}`);
    }

    // Text that sticks out of the nearest ancestor that clips its overflow is cut off.
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const overflow = getComputedStyle(parent).overflowX;
      const container = getComputedStyle(parent).containerType;
      if (overflow === "visible" && container === "normal") continue;
      const bounds = parent.getBoundingClientRect();
      if (rect.right > bounds.right + 1 || rect.left < bounds.left - 1) {
        problems.add(`wider than its container: ${label(element)}`);
      }
      break;
    }
  }
  return [...problems];
}

/** Layout boxes of everything on the page. Transforms are ignored, so a hover lift is not a shift. */
function layoutFingerprint(): string {
  const boxes = [...document.querySelectorAll<HTMLElement>("body *")].map((element) =>
    [element.offsetLeft, element.offsetTop, element.offsetWidth, element.offsetHeight].join(),
  );
  return `${document.documentElement.scrollHeight}|${boxes.join("|")}`;
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1100); // longest transition on the page is 0.9s
}

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("no text is clipped anywhere down the page", async ({ page }) => {
      test.slow();
      await page.goto("/");
      await settle(page);
      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);

      const problems: string[] = [];
      for (let y = 0; y < pageHeight; y += Math.round(viewport.height * 0.6)) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await settle(page);
        for (const problem of await page.evaluate(findClippedText)) {
          problems.push(`at ${y}px: ${problem}`);
        }
      }
      expect(problems).toEqual([]);
    });

    test("hovering does not move the layout", async ({ page }) => {
      test.setTimeout(180_000);
      await page.goto("/");
      await settle(page);
      const targets = page.locator("main a, footer a, [data-hero-meta] a, [data-card], h2, h3");
      const count = await targets.count();
      expect(count).toBeGreaterThan(10);

      const shifted: string[] = [];
      for (let i = 0; i < count; i++) {
        const target = targets.nth(i);
        // Scroll and point by hand: Playwright's own hover waits for the element to stop
        // moving, and the scroll cue never does.
        await page.mouse.move(0, 0);
        await target.evaluate((element) => element.scrollIntoView({ block: "center" }));
        await settle(page);
        const box = await target.boundingBox();
        if (!box) continue;
        const before = await page.evaluate(layoutFingerprint);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
        await page.waitForTimeout(450); // longest hover transition is 0.3s
        if ((await page.evaluate(layoutFingerprint)) !== before) {
          shifted.push((await target.textContent())?.trim().slice(0, 30) ?? `target ${i}`);
        }
      }
      expect(shifted).toEqual([]);
    });
  });
}

test("every project card opens its site", async ({ page }) => {
  await page.goto("/");
  const links = page.locator("[data-card] h3 a");
  await expect(links).toHaveCount(5);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute("href", /^https:\/\//);
    // The link covers the whole card, so a click anywhere on it follows the link.
    const card = link.locator("xpath=ancestor::article");
    const [linkBox, cardBox] = [await link.evaluate(coverBox), await card.boundingBox()];
    expect(linkBox.width).toBeCloseTo(cardBox?.width ?? 0, 0);
  }
});

function coverBox(link: Element) {
  const style = getComputedStyle(link, "::after");
  return { width: Number.parseFloat(style.width) };
}
