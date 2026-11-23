import type { APIRoute } from "astro";
import { profile } from "@/content/profile";

/** Pages a search engine should index. Add a path here when a new page is added. */
const PATHS = ["/", "/resume/"];

export const GET: APIRoute = () => {
  const urls = PATHS.map((path) => `  <url><loc>${profile.url}${path}</loc></url>`).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
};
