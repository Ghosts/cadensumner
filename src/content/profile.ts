/** Who the site is about. Every page, feed and agent endpoint reads from here. */
export const profile = {
  name: "Caden Sumner",
  role: "Product engineer",
  location: "Denver, Colorado",
  timeZone: "America/Denver",
  url: "https://cadensumner.com",
  /** Public source for this site. */
  repository: "https://github.com/Ghosts/cadensumner",
  summary:
    "Eight years at WeMod (Wand), Dashlane and Visa. I also run Jackalope Digital, where I build tools for coding agents.",
  statement:
    "I build software people use. Eight years on signup, onboarding and growth. The last year on tools for coding agents.",
  education: "B.S. Computer Science and Psychology, Michigan Technological University",
  /** Generated from /resume by `bun run assets`. */
  resumePdf: "/caden-sumner-resume.pdf",
  skills: [
    { area: "Languages", items: ["TypeScript", "JavaScript", "C#", "Rust", "SQL"] },
    { area: "Front end", items: ["React", "Next.js", "Astro", "Svelte", "Electron", "Tauri"] },
    {
      area: "Back end and infrastructure",
      items: ["Node.js", ".NET", "Cloudflare Workers", "Docker", "Kubernetes", "GitHub Actions"],
    },
    { area: "Data", items: ["PostgreSQL", "D1", "Firestore"] },
  ],
  links: [
    { label: "Email", url: "mailto:hello@cadensumner.com" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/cadensumner" },
    { label: "GitHub", url: "https://github.com/Ghosts" },
    { label: "X", url: "https://x.com/cadensumner" },
  ],
} as const;
