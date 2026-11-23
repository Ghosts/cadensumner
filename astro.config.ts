import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://cadensumner.com",
  // Pages are prerendered unless they opt out. The homepage opts out so it can
  // read live facts from KV and answer `Accept: text/markdown` on the same URL.
  output: "static",
  adapter: cloudflare(),
  session: false,
  devToolbar: { enabled: false },
});
