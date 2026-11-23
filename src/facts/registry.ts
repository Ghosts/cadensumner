import { allMcpsServerCount, githubContributions, npmMonthlyDownloads } from "./sources";
import type { Fact } from "./types";

/**
 * Every number on the site. Add one here, with its source, before using it in content.
 * `tests/unit/facts.test.ts` fails the build if a fact has no source or a stale date format.
 */
export const facts = {
  githubContributions: {
    value: 8708,
    label: "contributions on GitHub in the last year",
    asOf: "2026-11-23",
    source: "https://github.com/Ghosts",
    refresh: githubContributions("Ghosts"),
  },
  allMcpsServers: {
    value: 32606,
    label: "servers listed",
    asOf: "2026-11-23",
    source: "https://allmcps.com/llms.txt",
    refresh: allMcpsServerCount(),
  },
  jackalopeAgents: {
    value: 7,
    label: "coding agents supported",
    asOf: "2026-11-23",
    source: "https://jackalope.dev",
  },
  moxieDocsProductHuntRank: {
    value: 7,
    label: "Product of the Day on Product Hunt",
    asOf: "2026-07-23",
    source: "https://www.producthunt.com/leaderboard/daily/2026/7/23",
    format: "rank",
  },
  lopeBaseNpmDownloads: {
    value: 3489,
    label: "npm downloads last month",
    asOf: "2026-11-23",
    source: "https://www.npmjs.com/package/@lopebase/adapter",
    refresh: npmMonthlyDownloads(["@lopebase/adapter", "lopebase", "@lopebase/blog"]),
  },
  chaoswordDailyPuzzles: {
    value: 3,
    label: "new puzzles every evening",
    asOf: "2026-11-23",
    source: "https://chaosword.com",
  },
  printerFits: {
    value: 4091,
    label: "part-to-printer fits",
    asOf: "2026-11-23",
    source: "https://3dprinterfits.com",
  },
} satisfies Record<string, Fact>;

export type FactId = keyof typeof facts;
