import { handle } from "@astrojs/cloudflare/handler";
import { refreshFacts, saveSnapshot } from "@/facts/store";

/**
 * Worker entry. Astro handles every request; the cron trigger refreshes the
 * live numbers so pages never wait on GitHub or npm.
 */
export default {
  fetch(request, env, ctx) {
    return handle(request, env, ctx);
  },

  async scheduled(_controller, env) {
    const snapshot = await refreshFacts({ GITHUB_TOKEN: env.GITHUB_TOKEN });
    // Keep the previous snapshot if every source failed.
    if (Object.keys(snapshot.values).length > 0) await saveSnapshot(env.FACTS, snapshot);
  },
} satisfies ExportedHandler<Env>;
