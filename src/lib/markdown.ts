import { roles } from "@/content/experience";
import { profile } from "@/content/profile";
import { moreProjects, projects } from "@/content/work";
import type { ResolvedFacts } from "@/facts/store";

/**
 * The homepage as Markdown, built from the same content the HTML uses.
 * Served to clients that ask for `text/markdown`, and at `/index.md`.
 */
export function renderHomeMarkdown(facts: ResolvedFacts): string {
  const contributions = facts.githubContributions;
  const lines = [
    `# ${profile.name}`,
    "",
    `${profile.role} in ${profile.location}. ${profile.summary}`,
    "",
    `${contributions.text} ${contributions.label} ([source](${contributions.source})).`,
    "",
    "## Work",
    "",
    ...projects.map((project) => {
      const fact = facts[project.fact];
      return `- [${project.name}](${project.url}): ${project.summary} ${fact.text} ${fact.label} ([source](${fact.source})).`;
    }),
    ...moreProjects.map((project) => `- [${project.name}](${project.url}): ${project.summary}`),
    "",
    "## Experience",
    "",
    ...roles.map(
      (role) =>
        `- **${role.company}**, ${role.title} (${formatPeriod(role.start, role.end)}). ${role.summary}`,
    ),
    "",
    `Education: ${profile.education}.`,
    "",
    "## Contact",
    "",
    ...profile.links.map((link) => `- [${link.label}](${link.url})`),
    "",
    `Structured resume: ${profile.url}/resume.json`,
    "",
  ];
  return lines.join("\n");
}

export function formatPeriod(start: string, end?: string): string {
  return `${start.slice(0, 4)} to ${end ? end.slice(0, 4) : "present"}`;
}

/** True when the client prefers Markdown over HTML, as coding agents do. */
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const quality = (type: string) => {
    const entry = accept.split(",").find((part) => part.trim().toLowerCase().startsWith(type));
    if (!entry) return 0;
    const q = /;\s*q=([\d.]+)/.exec(entry)?.[1];
    return q === undefined ? 1 : Number(q);
  };
  const markdown = quality("text/markdown");
  return markdown > 0 && markdown >= quality("text/html");
}
