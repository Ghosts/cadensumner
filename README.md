# cadensumner.com

Source for [cadensumner.com](https://cadensumner.com), Caden Sumner's personal site.

One page, rendered by a Cloudflare Worker. The background is a WebGL shader, the scroll
effects are a few hundred lines of TypeScript with no animation library, and the same
content is served as Markdown and JSON for programs that ask for it.

## How it is put together

```
src/
  content/     What the site says: profile, projects, roles. Plain typed data.
  facts/       Every number on the site, with its source and how to refresh it.
  lib/         Markdown, JSON Resume and schema.org output built from content.
  components/  One Astro component per section of the page.
  scripts/     Browser code. motion.ts is the math, fluid/ is the shader, main.ts wires them to the page.
  pages/       Routes: the page, /index.md, /resume.json, /llms.txt.
  middleware.ts  Returns Markdown for `/` when the client sends `Accept: text/markdown`.
  worker.ts    Worker entry: serves the site and refreshes facts on a cron schedule.
tests/
  unit/        Facts, content, color contrast, scroll math.
  e2e/         Clipped text and hover shift at three screen sizes, accessibility, agent endpoints.
```

### Numbers are sourced

A number can only appear on the site if it is in [`src/facts/registry.ts`](src/facts/registry.ts)
with the URL where it can be checked. Facts that change (GitHub contributions, npm downloads,
the AllMCPs server count) have a `refresh` function. A cron trigger runs them every six hours
and stores the results in KV. The page reads KV on request and falls back to the committed
value if a source is down, so a failed fetch never shows a blank or a wrong number.

`bun run facts` prints live values next to the committed ones.

### Generated files

The resume PDF and the link-preview image are rendered from the running site, so they
cannot drift from it. With `bun run preview` running, `bun run assets` prints `/resume` to
`public/caden-sumner-resume.pdf` and screenshots the hero to `public/share.jpg`. Run it after
changing content or the hero, and commit the results.

### One URL, three formats

| Request                              | Response                                             |
| ------------------------------------ | ---------------------------------------------------- |
| `GET /` from a browser               | The page                                             |
| `GET /` with `Accept: text/markdown` | The same content as Markdown                         |
| `GET /index.md`                      | Markdown, for clients that cannot set headers        |
| `GET /resume.json`                   | [JSON Resume](https://jsonresume.org)                |
| `GET /resume`                        | Printable resume, also at `/caden-sumner-resume.pdf` |
| `GET /llms.txt`                      | Index of the above                                   |

All of them are generated from `src/content`, so they cannot drift apart.

### Motion without cost

- The page is readable with JavaScript off and with `prefers-reduced-motion`. Both are tested.
- A CSS gradient paints first. The shader starts after load, when the browser is idle.
- The shader begins at half resolution and sharpens only if frames are fast. On a machine
  with no GPU acceleration it draws still frames instead of animating.
- Effects use `transform`, `opacity` and color, so scrolling and hovering never move layout.

## Develop

Needs [Bun](https://bun.sh) and Node 24.

```sh
bun install
bun run dev        # local server in the Workers runtime
bun run verify     # everything CI runs
```

| Command              | What it checks                                                                 |
| -------------------- | ------------------------------------------------------------------------------ |
| `bun run lint`       | Biome: formatting and lint rules                                               |
| `bun run typecheck`  | TypeScript, strictest settings, across `.ts` and `.astro`                      |
| `bun run unused`     | Knip: unused files, exports and dependencies                                   |
| `bun run test`       | Vitest unit tests                                                              |
| `bun run test:e2e`   | Playwright against the production build                                        |
| `bun run lighthouse` | Lighthouse: 100 for accessibility, best practices and SEO, 95+ for performance |

Playwright uses the Chrome already installed on the machine.

## Deploy

```sh
bun run deploy
```

Wrangler creates the `FACTS` KV namespace on first deploy. To refresh the GitHub
contribution count, add a read-only token:

```sh
bunx wrangler secret put GITHUB_TOKEN
```

## License

Code is [MIT](LICENSE). The written content and the name are not: please do not
republish the site as your own.
