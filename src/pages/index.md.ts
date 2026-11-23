import type { APIRoute } from "astro";
import { currentFacts, HOME_CACHE_HEADERS } from "@/lib/home";
import { renderHomeMarkdown } from "@/lib/markdown";

export const prerender = false;

/** The homepage as Markdown, for clients that cannot send an Accept header. */
export const GET: APIRoute = async () =>
  new Response(renderHomeMarkdown(await currentFacts()), {
    headers: { "content-type": "text/markdown; charset=utf-8", ...HOME_CACHE_HEADERS },
  });
