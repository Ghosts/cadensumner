import { env } from "cloudflare:workers";
import { loadSnapshot, type ResolvedFacts, resolveFacts } from "@/facts/store";

/** Facts for the current request: refreshed values from KV over the committed ones. */
export async function currentFacts(): Promise<ResolvedFacts> {
  return resolveFacts(await loadSnapshot(env.FACTS));
}

/**
 * The page changes at most every few hours, so let the edge hold it briefly and
 * serve a stale copy while it fetches a new one. `Vary: Accept` keeps the HTML
 * and Markdown versions of the same URL apart.
 */
export const HOME_CACHE_HEADERS = {
  "cache-control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
  vary: "Accept",
} as const;
