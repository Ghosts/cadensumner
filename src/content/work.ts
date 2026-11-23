import type { FactId } from "@/facts/registry";

/** Three colors that tint the background canvas while a project is on screen. */
type Palette = readonly [string, string, string];

export interface Project {
  name: string;
  url: string;
  summary: string;
  /** The number shown on the card. Must exist in the facts registry. */
  fact: FactId;
  tags: readonly string[];
  /** Card background and the text color that passes WCAG AA on it. */
  surface: string;
  ink: string;
  palette: Palette;
}

export const projects: readonly Project[] = [
  {
    name: "Jackalope",
    url: "https://jackalope.dev",
    summary:
      "Run Claude Code, Codex and Gemini side by side. Each agent gets its own worktree. You review every change before it merges.",
    fact: "jackalopeAgents",
    tags: ["Rust", "Tauri", "React", "Open source"],
    surface: "#5b3fd6",
    ink: "#ffffff",
    palette: ["#8f6bff", "#e9ddff", "#1b0b4a"],
  },
  {
    name: "AllMCPs",
    url: "https://allmcps.com",
    summary: "The open directory for MCP servers.",
    fact: "allMcpsServers",
    tags: ["Next.js", "Workers", "D1"],
    surface: "#00d5ee",
    ink: "#021018",
    palette: ["#00e5ff", "#007bff", "#02101f"],
  },
  {
    name: "Moxie Docs",
    url: "https://moxiedocs.com",
    summary: "Docs for private GitHub repos. It flags the pages a code change made stale.",
    fact: "moxieDocsProductHuntRank",
    tags: ["Next.js", "Supabase", "Stripe", "MCP"],
    surface: "#5ef2b4",
    ink: "#04121a",
    palette: ["#5ef2b4", "#0b6b8c", "#05091a"],
  },
  {
    name: "LopeBase",
    url: "https://lopebase.com",
    summary: "One console for every SaaS product you run. Works from the CLI or an agent.",
    fact: "lopeBaseNpmDownloads",
    tags: ["Bun", "CLI", "MCP"],
    surface: "#e9e2ff",
    ink: "#150f2b",
    palette: ["#c9b8ff", "#5a3cc9", "#100d18"],
  },
  {
    name: "Chaosword",
    url: "https://chaosword.com",
    summary: "Three new crosswords every evening, generated and checked before they publish.",
    fact: "chaoswordDailyPuzzles",
    tags: ["Next.js", "D1", "Cron"],
    surface: "#ff5fae",
    ink: "#1a0a14",
    palette: ["#ff2e93", "#ffe94a", "#1a0a14"],
  },
];

/** Smaller projects, listed under the cards. */
export const moreProjects = [
  {
    name: "3D Printer Fits",
    url: "https://3dprinterfits.com",
    summary: "Which parts and upgrades fit which 3D printer.",
  },
  {
    name: "ResumeSkip",
    url: "https://resumeskip.com",
    summary: "Tailors a resume to a job listing and tracks applications.",
  },
] as const;
