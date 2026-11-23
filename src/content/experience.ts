export interface Role {
  company: string;
  title: string;
  /** ISO year-month. `end` is omitted for a current role. */
  start: string;
  end?: string;
  /** The one result to remember, and what it measures. */
  headline: string;
  summary: string;
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
  },
  {
    company: "Dashlane",
    title: "Senior Software Engineer",
    start: "2021-08",
    end: "2023-11",
    headline: "2 weeks",
    summary:
      "Shipped direct import from LastPass two weeks after their breach. Owned the first seven days for 20,000 business accounts, including SSO and SCIM. Led accessibility for web and extensions.",
  },
  {
    company: "Visa",
    title: "Full Stack Engineer",
    start: "2020-01",
    end: "2021-08",
    headline: "Millions",
    summary:
      "C# and React apps with millions of users. Helped start the innovation team that built the React starter and Kubernetes autoscaling for the tokenization platform.",
  },
  {
    company: "TimeSlot",
    title: "Co-founder, Burgundy Labs",
    start: "2018-04",
    end: "2025-07",
    headline: "7,000",
    summary:
      "Students used the scheduling software for university learning centers that I co-founded at Michigan Tech and ran until 2025.",
  },
];
