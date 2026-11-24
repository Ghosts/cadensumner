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

test("the sitemap lists every page and robots.txt points to it", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://cadensumner.com/</loc>");
  expect(sitemap).toContain("<loc>https://cadensumner.com/resume/</loc>");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap: https://cadensumner.com/sitemap.xml");
});

test("/mcp answers an MCP client", async ({ request }) => {
  const rpc = async (method: string, params: unknown = {}) => {
    const response = await request.post("/mcp", {
      data: { jsonrpc: "2.0", id: 1, method, params },
      headers: { accept: "application/json, text/event-stream" },
    });
    expect(response.headers()["access-control-allow-origin"]).toBe("*");
    return (await response.json()).result;
  };

  const initialized = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {} });
  expect(initialized.serverInfo.name).toBe("cadensumner");

  const { tools } = await rpc("tools/list");
  expect(tools.map((tool: { name: string }) => tool.name)).toContain("get_experience");

  const projects = await rpc("tools/call", { name: "list_projects", arguments: {} });
  expect(projects.structuredContent.projects[0].name).toBe("Jackalope");

  const notification = await request.post("/mcp", {
    data: { jsonrpc: "2.0", method: "notifications/initialized" },
  });
  expect(notification.status()).toBe(202);
  expect((await request.get("/mcp")).status()).toBe(405);
});

test("the page links to the MCP server and to how it was built", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="mcp"]')).toHaveAttribute("href", "/mcp");
  await expect(page.getByRole("link", { name: "How this site is built" })).toHaveAttribute(
    "href",
    "https://github.com/Ghosts/cadensumner#readme",
  );
  expect(await (await request.get("/llms.txt")).text()).toContain("https://cadensumner.com/mcp");
});
