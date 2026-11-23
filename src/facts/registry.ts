import {
  allMcpsCategoryCount,
  allMcpsServerCount,
  githubContributions,
  npmMonthlyDownloads,
} from "./sources";
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
  allMcpsCategories: {
    value: 51,
    label: "categories",
    asOf: "2026-11-23",
    source: "https://allmcps.com/llms.txt",
    refresh: allMcpsCategoryCount(),
  },
  jackalopePlatforms: {
    value: 3,
    label: "desktop platforms",
    asOf: "2026-11-23",
    source: "https://jackalope.dev",
  },
  jackalopeAgents: {
    value: 7,
    label: "coding agents",
    asOf: "2026-11-23",
    source: "https://jackalope.dev",
  },
  moxieDocsProductHuntRank: {
    value: 7,
    label: "on Product Hunt",
    asOf: "2026-07-23",
    source: "https://www.producthunt.com/leaderboard/daily/2026/7/23",
    format: "rank",
  },
  resumeSkipBrowsers: {
    value: 2,
    label: "browser extensions",
    asOf: "2026-11-23",
    source: "https://resumeskip.com/extension",
  },
  resumeSkipLanguages: {
    value: 5,
    label: "languages",
    asOf: "2026-11-23",
    source: "https://resumeskip.com/llms.txt",
  },
  lopeBaseNpmDownloads: {
    value: 3489,
    label: "npm downloads a month",
    asOf: "2026-11-23",
    source: "https://www.npmjs.com/package/@lopebase/adapter",
    refresh: npmMonthlyDownloads(["@lopebase/adapter", "lopebase", "@lopebase/blog"]),
  },
  chaoswordDailyPuzzles: {
    value: 3,
    label: "new puzzles a day",
    asOf: "2026-11-23",
    source: "https://chaosword.com",
  },
} satisfies Record<string, Fact>;

export type FactId = keyof typeof facts;
