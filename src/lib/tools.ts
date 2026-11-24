import { publications, roles } from "@/content/experience";
import { profile } from "@/content/profile";
import { projects } from "@/content/work";
import type { ResolvedFacts } from "@/facts/store";
import { jsonResume } from "@/lib/structured-data";

/**
 * The questions a program can ask about Caden, as tools. The MCP endpoint at
 * /mcp and the in-page WebMCP tools both serve this list, and it is built from
 * the same content as the page, so the three cannot disagree.
 */

type JsonObject = Record<string, unknown>;

export interface ToolContext {
  /** The numbers as they stand for this request. */
  facts: ResolvedFacts;
}

export interface Tool {
  name: string;
  title: string;
  /** Written for a model deciding whether to call the tool. */
  description: string;
  /** JSON Schema for the arguments. */
  inputSchema: JsonObject;
  run(args: JsonObject, context: ToolContext): JsonObject;
}

/** An argument that is not valid for the tool. Reported to the caller as a tool error. */
export class ToolInputError extends Error {}

const NO_ARGUMENTS = { type: "object", properties: {}, additionalProperties: false } as const;

/** Reads an optional string argument, or fails with a message the caller can act on. */
function optionalString(args: JsonObject, key: string, allowed?: readonly string[]) {
  const value = args[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new ToolInputError(`"${key}" must be a string.`);
  if (allowed && !allowed.includes(value)) {
    throw new ToolInputError(`"${key}" must be one of: ${allowed.join(", ")}.`);
  }
  return value;
}

const PUBLICATION_KINDS = ["paper", "post", "press"] as const;

export const tools: readonly Tool[] = [
  {
    name: "get_profile",
    title: "Profile",
    description:
      "Who Caden Sumner is: role, location, a short summary, skills, education and links. Start here.",
    inputSchema: NO_ARGUMENTS,
    run: () => ({
      name: profile.name,
      role: profile.role,
      location: profile.location,
      timeZone: profile.timeZone,
      summary: profile.summary,
      education: profile.education,
      skills: profile.skills,
      links: profile.links,
      url: profile.url,
    }),
  },
  {
    name: "get_experience",
    title: "Work history",
    description:
      "Caden's jobs, newest first, with dates, a summary and the detailed results from his resume. Pass `company` to get one employer.",
    inputSchema: {
      type: "object",
      properties: {
        company: {
          type: "string",
          description: 'Part of a company name, such as "Dashlane". Leave out for every role.',
        },
      },
      additionalProperties: false,
    },
    run: (args) => {
      const company = optionalString(args, "company")?.toLowerCase();
      const matches = roles.filter(
        (role) => !company || role.company.toLowerCase().includes(company),
      );
      return {
        roles: matches.map((role) => ({
          company: role.company,
          title: role.title,
          start: role.start,
          end: role.end ?? null,
          current: !role.end,
          summary: role.summary,
          highlights: role.highlights,
        })),
      };
    },
  },
  {
    name: "list_projects",
    title: "Products",
    description:
      "The products Caden builds at Jackalope Digital, each with its site, stack and current numbers. Every number names the page where it can be checked.",
    inputSchema: NO_ARGUMENTS,
    run: (_args, { facts }) => ({
      projects: projects.map((project) => ({
        name: project.name,
        url: project.url,
        kind: project.kind,
        summary: project.summary,
        stack: project.tags,
        numbers: project.facts.map((id) => ({
          value: facts[id].value,
          text: `${facts[id].text} ${facts[id].label}`,
          source: facts[id].source,
        })),
      })),
    }),
  },
  {
    name: "list_writing",
    title: "Writing and press",
    description:
      "Things Caden has written (a peer-reviewed paper and blog posts) and press about him, newest first, with links.",
    inputSchema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: PUBLICATION_KINDS,
          description: "Only this kind. Leave out for all of them.",
        },
      },
      additionalProperties: false,
    },
    run: (args) => {
      const kind = optionalString(args, "kind", PUBLICATION_KINDS);
      return {
        items: publications
          .filter((publication) => !kind || publication.kind === kind)
          .map((publication) => ({
            kind: publication.kind,
            title: publication.title,
            year: publication.year,
            venue: publication.venue,
            coauthors: publication.coauthors ?? [],
            summary: publication.summary,
            url: publication.url,
          })),
      };
    },
  },
  {
    name: "get_resume",
    title: "Resume",
    description:
      "Caden's full resume in JSON Resume format, with links to the printable page and the PDF.",
    inputSchema: NO_ARGUMENTS,
    run: () => ({
      page: `${profile.url}/resume`,
      pdf: `${profile.url}${profile.resumePdf}`,
      resume: jsonResume(),
    }),
  },
  {
    name: "get_contact",
    title: "Contact",
    description: "How to reach Caden: email and his profiles on other sites.",
    inputSchema: NO_ARGUMENTS,
    run: () => ({
      email: profile.links.find((link) => link.url.startsWith("mailto:"))?.url.slice(7) ?? null,
      links: profile.links.filter((link) => link.url.startsWith("https://")),
      timeZone: profile.timeZone,
    }),
  },
  {
    name: "get_site",
    title: "About this site",
    description:
      "How cadensumner.com is built and where its source and machine-readable versions are.",
    inputSchema: NO_ARGUMENTS,
    run: () => ({
      source: profile.repository,
      stack: [
        "Astro on Cloudflare Workers, no client framework",
        "Hand-written WebGL shader and scroll effects, no animation library",
        "Every number comes from a registry with a source and is refreshed on a schedule",
        "Accessibility and Lighthouse checks run on every change",
      ],
      formats: {
        markdown: `${profile.url}/index.md`,
        resumeJson: `${profile.url}/resume.json`,
        llmsTxt: `${profile.url}/llms.txt`,
        mcp: `${profile.url}/mcp`,
      },
    }),
  },
];

export function findTool(name: string): Tool | undefined {
  return tools.find((tool) => tool.name === name);
}
