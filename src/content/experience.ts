export interface Role {
  company: string;
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
    company: "WeMod",
    title: "Senior Software Engineer",
    start: "2023-11",
    headline: "+50%",
    summary:
      "Acquisition up 50% year over year from onboarding and conversion experiments. Hired and mentored ten engineers. Moved the app from Laravel to a Next.js monorepo and built realtime features on Durable Objects for millions of users.",
    highlights: [
      "Ran A/B tests on onboarding, retention and Pro conversion. Acquisition and conversion rose 50% year over year.",
      "Hired and mentored four back-end and six front-end engineers, doubling the team. Added automated review and CI checks to the release process.",
      "Built game-help assistants on OpenAI and Gemini models. Cut release build time by 60% and wrote an agent skill that automates releases.",
      "Migrated the Laravel app to a Next.js and React monorepo on Turborepo. Built realtime features on Cloudflare Durable Objects for millions of users.",
      "Maintained the Electron desktop app and Ionic mobile apps, including more than 500 interactive game maps.",
    ],
  },
  {
    company: "Dashlane",
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
