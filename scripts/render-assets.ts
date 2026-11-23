/**
 * Renders the two files that are generated from the running site:
 *
 *   public/caden-sumner-resume.pdf  printed from /resume
 *   public/share.jpg                the hero, as the preview image for shared links
 *
 * Run `bun run build && bun run preview` in one terminal, then `bun run assets`
 * in another, and commit the results. Pass a different origin as the first
 * argument to render from somewhere else.
 */
import { chromium, type Page } from "@playwright/test";

const origin = process.argv[2] ?? "http://localhost:4321";
const SHARE_IMAGE = { width: 1200, height: 630 };

// A real GPU gives the share image the animated shader; without one the page falls back to a still frame.
/** `document.fonts.ready` can resolve before a font has been requested, so ask for each face by name. */
async function loadFonts(page: Page) {
  await page.evaluate(async () => {
    await Promise.all([...document.fonts].map((font) => font.load()));
    await document.fonts.ready;
  });
}

const browser = await chromium.launch({
  channel: "chrome",
  args: ["--use-angle=default", "--enable-gpu", "--ignore-gpu-blocklist"],
});

try {
  const resume = await browser.newPage();
  await resume.goto(`${origin}/resume`);
  await loadFonts(resume);
  await resume.pdf({ path: "public/caden-sumner-resume.pdf", preferCSSPageSize: true });
  console.log("wrote public/caden-sumner-resume.pdf");

  const hero = await browser.newPage({ viewport: SHARE_IMAGE });
  await hero.goto(origin);
  await loadFonts(hero);
  // The scroll cue means nothing in a still image.
  await hero.addStyleTag({ content: "[data-hero-meta] a { display: none !important }" });
  await hero.waitForSelector("html.has-fluid");
  await hero.waitForTimeout(1500);
  await hero.screenshot({ path: "public/share.jpg", quality: 88 });
  console.log("wrote public/share.jpg");
} finally {
  await browser.close();
}
