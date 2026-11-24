/** `name` is the brand the logo spells out, read to screen readers. */
interface EmployerLogo {
  file: "wand" | "dashlane" | "visa";
  name: string;
}

export interface Role {
  company: string;
  /** File in src/assets/logos, for employers whose logo is shown on the homepage. */
  logo?: EmployerLogo;
  title: string;
  /** ISO year-month. `end` is omitted for a current role. */
  start: string;
  end?: string;
  /** The one result to remember, and what it measures. */
  headline: string;
  summary: string;
  /** Fuller detail for the resume page. */
  highlights: readonly string[];
}

/**
 * Employment history. These figures are Caden's own, taken from his resume.
 * They describe internal work at each company and have no public source to link.
 */
export const roles: readonly Role[] = [
  {
    // WeMod renamed itself Wand in 2025. The 40 million figure is from the
    // announcement: https://wand.com/en/news/introducing-wand
    company: "WeMod (Wand)",
    logo: { file: "wand", name: "Wand" },
    title: "Senior Software Engineer",
    start: "2023-11",
    headline: "+50%",
    summary:
      "Acquisition up 50% year over year from onboarding and conversion experiments. Hired and mentored ten engineers. Moved the app from Laravel to a Next.js monorepo and built realtime features on Durable Objects. More than 40 million people have used WeMod.",
    highlights: [
      "Ran A/B tests on onboarding, retention and Pro conversion. Acquisition and conversion rose 50% year over year.",
      "Hired and mentored four back-end and six front-end engineers, doubling the team. Added automated review and CI checks to the release process.",
      "Built game-help assistants on OpenAI and Gemini models. Cut release build time by 60% and wrote an agent skill that automates releases.",
      "Migrated the Laravel app to a Next.js and React monorepo on Turborepo. Built realtime features on Cloudflare Durable Objects for an app more than 40 million people have used.",
      "Maintained the Electron desktop app and Ionic mobile apps, including more than 500 interactive game maps.",
    ],
  },
  {
    company: "Dashlane",
    logo: { file: "dashlane", name: "Dashlane" },
    title: "Senior Software Engineer",
    start: "2021-08",
    end: "2023-11",
    headline: "2 weeks",
    summary:
      "Shipped direct import from LastPass two weeks after their breach. Owned the first seven days for 20,000 business accounts, including SSO and SCIM. Led accessibility for web and extensions.",
    highlights: [
      "Owned the first seven days for users and admins across more than 20,000 business accounts.",
      "Technical lead for the Onboarding Activation team: SCIM provisioning, SAML single sign-on and encrypted audit logs, in React and TypeScript.",
      "Built direct import from LastPass and shipped it within two weeks of their breach.",
      "Led accessibility (WCAG) for the web app and browser extensions.",
    ],
  },
  {
    company: "Visa",
    logo: { file: "visa", name: "Visa" },
    title: "Full Stack Engineer",
    start: "2020-01",
    end: "2021-08",
    headline: "Millions",
    summary:
      "C# and React apps with millions of users. Helped start the innovation team that built the React starter and Kubernetes autoscaling for the tokenization platform.",
    highlights: [
      "Built C#, ASP.NET and React applications used by millions of people.",
      "Helped start an innovation team that built a React starter and Kubernetes autoscaling for the tokenization platform.",
      "Automated build and deploy pipelines with Jenkins and Docker.",
    ],
  },
  {
    company: "TimeSlot",
    title: "Co-founder, Burgundy Labs",
    start: "2018-04",
    end: "2025-07",
    headline: "7,000",
    summary:
      "Students used the scheduling software for university learning centers that I co-founded at Michigan Tech and ran until 2025.",
    highlights: [
      "Designed and built a React and .NET Core service for university learning centers, used by more than 7,000 students.",
      "Ran the product end to end: architecture, deploy pipeline, sales and support.",
    ],
  },
];

/** Something Caden wrote, or that was written about him. */
export interface Publication {
  /** A paper is peer reviewed, a post is his own writing, press is written by someone else. */
  kind: "paper" | "post" | "press";
  title: string;
  year: number;
  /** Where it was published. */
  venue: string;
  coauthors?: readonly string[];
  summary: string;
  url: string;
}

/** Newest first. */
export const publications: readonly Publication[] = [
  {
    kind: "post",
    title: "Launching Moxie Docs",
    year: 2026,
    venue: "Medium",
    summary: "The launch post for Moxie Docs, documentation for private GitHub repos.",
    url: "https://medium.com/vibe-coding/launching-moxie-docs-developer-documentation-0a0681a914f5",
  },
  {
    kind: "post",
    title: "Web Accessibility at Dashlane",
    year: 2022,
    venue: "Dashlane Engineering",
    summary:
      "How Dashlane keeps its web app and extensions accessible: lint rules, role-based tests and design review.",
    url: "https://medium.com/dashlane-engineering/web-accessibility-at-dashlane-5ae51095e45d",
  },
  {
    kind: "post",
    title: "Lessons From a Failed Startup",
    year: 2021,
    venue: "Medium",
    summary: "Five lessons from co-founding Burgundy Labs and selling TimeSlot to universities.",
    url: "https://caden.medium.com/lessons-from-a-failed-startup-68af8afcc5fc",
  },
  {
    kind: "paper",
    title:
      "Equality in Dictator Games: Methodological Concerns in Interpreting Default-Mode Strategies and Norms for Equity",
    year: 2018,
    venue: "Proceedings of the 40th Annual Conference of the Cognitive Science Society",
    coauthors: ["Samantha Verran", "Dr. Shane Mueller"],
    summary:
      "Two experiments on why people split money evenly in dictator games. Presented as a poster at the Cognitive Science Society conference.",
    url: "https://escholarship.org/uc/item/3kv0p16j",
  },
  {
    kind: "press",
    title: "Leading the Pack: Caden Sumner",
    year: 2018,
    venue: "Michigan Tech News",
    summary: "A university news profile of the student team I led that built TimeSlot.",
    url: "https://www.mtu.edu/news/2018/03/leading-the-pack-caden-sumner.html",
  },
];

/** "With A and B. " for work with coauthors, otherwise nothing. */
export function coauthorCredit(publication: Publication): string {
  return publication.coauthors ? `With ${publication.coauthors.join(" and ")}. ` : "";
}
