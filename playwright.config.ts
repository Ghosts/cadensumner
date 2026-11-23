import { defineConfig } from "@playwright/test";

const PORT = 4321;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // The installed Chrome, so there is no separate browser download.
    channel: "chrome",
  },
  // Tests run against the production build in the Workers runtime.
  webServer: {
    command: `bun run preview --port ${PORT}`,
    url: `http://localhost:${PORT}/llms.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
