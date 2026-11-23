import type { APIRoute } from "astro";
import { profile } from "@/content/profile";

/** Index for language models, following https://llmstxt.org. */
export const GET: APIRoute = () => {
  const body = [
    `# ${profile.name}`,
    "",
    `> ${profile.role} in ${profile.location}. ${profile.summary}`,
    "",
    "## Pages",
    "",
    `- [Profile](${profile.url}/index.md): work, experience and contact details`,
    `- [Resume](${profile.url}/resume): full work history and skills`,
    `- [Resume as JSON](${profile.url}/resume.json): JSON Resume format`,
    "",
    `The homepage also returns Markdown when requested with \`Accept: text/markdown\`.`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
};
