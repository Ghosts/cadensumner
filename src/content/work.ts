import type { FactId } from "@/facts/registry";

/** Three colors that tint the background canvas while a project is on screen. */
type Palette = readonly [string, string, string];

export interface Project {
  name: string;
  url: string;
  /** What kind of thing it is, in a few words. */
  kind: string;
  summary: string;
  /** File in /public/logos. */
  logo: string;
  /** True when the logo file already draws its own rounded background. */
  logoHasTile?: boolean;
  /** One to three numbers shown on the card. Each must exist in the facts registry. */
  facts: readonly FactId[];
  tags: readonly string[];
  /** Card color and the text color that passes WCAG AA on it. */
  surface: string;
  ink: string;
  palette: Palette;
}

export const projects: readonly Project[] = [
  {
    name: "Jackalope",
    url: "https://jackalope.dev",
    kind: "Desktop app, open source",
    summary:
      "Run Claude Code, Codex and Gemini side by side. Each agent gets its own worktree. You review every change before it merges.",
    logo: "jackalope.svg",
    logoHasTile: true,
    facts: ["jackalopeAgents", "jackalopePlatforms"],
    tags: ["Rust", "Tauri", "React"],
    surface: "#5b3fd6",
    ink: "#ffffff",
    palette: ["#8f6bff", "#e9ddff", "#1b0b4a"],
  },
  {
    name: "AllMCPs",
    url: "https://allmcps.com",
    kind: "Directory, free to list",
    summary: "The open directory for MCP servers.",
    logo: "allmcps.svg",
    facts: ["allMcpsServers", "allMcpsCategories"],
    tags: ["Next.js", "Workers", "D1"],
    surface: "#00d5ee",
    ink: "#021018",
    palette: ["#00e5ff", "#007bff", "#02101f"],
  },
  {
    name: "Moxie Docs",
    url: "https://moxiedocs.com",
    kind: "SaaS for engineering teams",
    summary: "Docs for private GitHub repos. It flags the pages a code change made stale.",
    logo: "moxie-docs.svg",
    facts: ["moxieDocsProductHuntRank"],
    tags: ["Next.js", "Supabase", "Stripe", "MCP"],
    surface: "#5ef2b4",
    ink: "#04121a",
    palette: ["#5ef2b4", "#0b6b8c", "#05091a"],
  },
  {
    name: "ResumeSkip",
    url: "https://resumeskip.com",
    kind: "Web app and browser extension",
    summary:
      "Tailors the resume you already have to a job posting, from the web app or from the listing itself with the extension.",
    logo: "resumeskip.svg",
    logoHasTile: true,
    facts: ["resumeSkipBrowsers", "resumeSkipLanguages"],
    tags: ["React", "Convex", "WXT", "MCP"],
    surface: "#ff8a4c",
    ink: "#1f1410",
    palette: ["#ff6b35", "#ffd9a8", "#1f1a17"],
  },
  {
    name: "LopeBase",
    url: "https://lopebase.com",
    kind: "Ops console, MCP and CLI",
    summary: "One console for every SaaS product you run. Works from the CLI or an agent.",
    logo: "lopebase.svg",
    logoHasTile: true,
    facts: ["lopeBaseNpmDownloads"],
    tags: ["Bun", "CLI", "MCP"],
    surface: "#e9e2ff",
    ink: "#150f2b",
    palette: ["#c9b8ff", "#5a3cc9", "#100d18"],
  },
  {
    name: "Chaosword",
    url: "https://chaosword.com",
    kind: "Daily game, free to play",
    summary: "Three new crosswords every evening, generated and checked before they publish.",
    logo: "chaosword.svg",
    logoHasTile: true,
    facts: ["chaoswordDailyPuzzles"],
    tags: ["Next.js", "D1", "Cron"],
    surface: "#ff5fae",
    ink: "#1a0a14",
    palette: ["#ff2e93", "#ffe94a", "#1a0a14"],
  },
];
