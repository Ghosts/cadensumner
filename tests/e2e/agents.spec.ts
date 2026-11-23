import { expect, test } from "@playwright/test";

/** What a program sees: the same content as the page, in formats it can parse. */

test("the homepage answers in Markdown when asked", async ({ request }) => {
  const response = await request.get("/", { headers: { accept: "text/markdown" } });
  expect(response.headers()["content-type"]).toContain("text/markdown");
  expect(response.headers().vary).toContain("Accept");
  const body = await response.text();
  expect(body).toMatch(/^# Caden Sumner/);
  expect(body).toContain("[Jackalope](https://jackalope.dev)");
});

test("the homepage answers in HTML for browsers", async ({ request }) => {
  const response = await request.get("/", {
    headers: { accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
  });
  expect(response.headers()["content-type"]).toContain("text/html");
});

test("/index.md matches the negotiated Markdown", async ({ request }) => {
  const negotiated = await request.get("/", { headers: { accept: "text/markdown" } });
  const direct = await request.get("/index.md");
  expect(await direct.text()).toBe(await negotiated.text());
});

test("/resume.json is a JSON Resume", async ({ request }) => {
  const resume = await (await request.get("/resume.json")).json();
  expect(resume.basics.name).toBe("Caden Sumner");
  expect(resume.work.length).toBeGreaterThan(2);
});

test("/llms.txt points at the machine-readable pages", async ({ request }) => {
  const body = await (await request.get("/llms.txt")).text();
  expect(body).toContain("/index.md");
  expect(body).toContain("/resume.json");
});

test("the page advertises its alternates and structured data", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
    "href",
    "/index.md",
  );
  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
  );
  expect(jsonLd["@type"]).toBe("ProfilePage");
  expect(jsonLd.mainEntity.sameAs).toContain("https://github.com/Ghosts");
});

test("/resume is a printable page with a PDF copy", async ({ page, request }) => {
  await page.goto("/resume");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Caden Sumner");
  await expect(page.getByRole("heading", { name: "Experience" })).toBeVisible();
  const pdf = await request.get("/caden-sumner-resume.pdf");
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
});

test("shared links get a preview image", async ({ page, request }) => {
  await page.goto("/");
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toBe("https://cadensumner.com/share.jpg");
  const response = await request.get("/share.jpg");
  expect(response.headers()["content-type"]).toContain("image/jpeg");
});
