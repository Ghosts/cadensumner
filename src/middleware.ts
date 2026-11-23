import { defineMiddleware } from "astro:middleware";
import { currentFacts, HOME_CACHE_HEADERS } from "@/lib/home";
import { prefersMarkdown, renderHomeMarkdown } from "@/lib/markdown";

/**
 * Content negotiation for the homepage: a client that asks for Markdown gets the
 * same content as Markdown, at the same URL. Coding agents send this header.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const isHome = context.url.pathname === "/";
  if (isHome && prefersMarkdown(context.request.headers.get("accept"))) {
    return new Response(renderHomeMarkdown(await currentFacts()), {
      headers: { "content-type": "text/markdown; charset=utf-8", ...HOME_CACHE_HEADERS },
    });
  }
  return next();
});
