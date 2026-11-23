import { handle } from "@astrojs/cloudflare/handler";
import { refreshFacts, saveSnapshot } from "@/facts/store";

/**
 * Worker entry. Astro handles every request; the cron trigger refreshes the
 * live numbers so pages never wait on GitHub or npm.
 */
export default {
  fetch(request, env, ctx) {
    // One canonical address: send www to the bare domain.
    const url = new URL(request.url);
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.href, 301);
    }
    return handle(request, env, ctx);
  },

  async scheduled(_controller, env) {
    const snapshot = await refreshFacts({ GITHUB_TOKEN: env.GITHUB_TOKEN });
    // Keep the previous snapshot if every source failed.
    if (Object.keys(snapshot.values).length > 0) await saveSnapshot(env.FACTS, snapshot);
  },
} satisfies ExportedHandler<Env>;
