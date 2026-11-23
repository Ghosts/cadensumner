# 1. Astro on Cloudflare Workers, no client framework

Date: 2026-11-23

## Context

The site is one page whose value is how it looks and moves. It also has to load fast,
serve the same content to programs, and show numbers that stay current without a redeploy.
The domain is already on Cloudflare.

## Decision

- **Astro 7 with the Cloudflare adapter.** It ships no JavaScript unless a page asks for it,
  so the whole script budget goes to the shader and scroll effects. Development runs in the
  same Workers runtime as production.
- **No React, no animation library, no three.js.** The background is one fragment shader on a
  full-screen triangle, and the scroll effects are small pure functions. The page ships about
  3 kB of script, gzipped. A library would cost more than the code it replaced.
- **The homepage is rendered on request, then cached at the edge.** It needs live numbers and
  content negotiation. Other routes are prerendered.
- **A cron trigger refreshes numbers into KV.** Requests never wait on GitHub or npm, and a
  committed fallback covers a source being down.
- **Bun, Biome, Knip, Vitest, Playwright, Lighthouse CI** as the gates, run by `bun run verify`
  and in CI.

## Alternatives considered

- **Next.js through OpenNext.** Familiar, but it hydrates a React tree this page does not need.
- **SvelteKit.** A small runtime and a good fit; passed over because Astro's default of no
  runtime at all suits a single page better.
- **A fully static site.** Simplest, but live numbers would need a rebuild and Markdown
  negotiation would need a second system.

## Consequences

- Later features that need state (a live activity feed, a chat agent) will add Durable Objects
  to the same Worker through `src/worker.ts`.
- Interactive islands, if any are added, should load on interaction so the first paint stays as it is.
