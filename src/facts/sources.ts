import type { RefreshEnv } from "./types";

const USER_AGENT = "cadensumner.com facts refresher";

async function getText(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, {
    ...init,
    headers: { "user-agent": USER_AGENT, ...init?.headers },
  });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return response.text();
}

/** Contributions in the last year, as shown on the GitHub profile. Needs a token. */
export function githubContributions(login: string) {
  return async (env: RefreshEnv): Promise<number> => {
    if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not set");
    const query = `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar { totalContributions } } } }`;
    const body = await getText("https://api.github.com/graphql", {
      method: "POST",
      headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ query, variables: { login } }),
    });
    const total =
      JSON.parse(body)?.data?.user?.contributionsCollection?.contributionCalendar
        ?.totalContributions;
    return expectCount(total, "GitHub contributions");
  };
}

/** Downloads in the last month, summed across the given npm packages. */
export function npmMonthlyDownloads(packages: readonly string[]) {
  return async (): Promise<number> => {
    const counts = await Promise.all(
      packages.map(async (name) => {
        const body = await getText(`https://api.npmjs.org/downloads/point/last-month/${name}`);
        return expectCount(JSON.parse(body)?.downloads, `npm downloads for ${name}`);
      }),
    );
    return counts.reduce((sum, count) => sum + count, 0);
  };
}

/** Server count that AllMCPs publishes in its own llms.txt. */
export function allMcpsServerCount() {
  return async (): Promise<number> => {
    const body = await getText("https://allmcps.com/llms.txt");
    return parseAllMcpsServerCount(body);
  };
}

export function parseAllMcpsServerCount(llmsTxt: string): number {
  const match = /Total MCP Servers:\*\*\s*([\d,]+)/.exec(llmsTxt);
  return expectCount(Number(match?.[1]?.replaceAll(",", "")), "AllMCPs server count");
}

/** Rejects anything that is not a positive whole number, so a broken source cannot publish "NaN". */
export function expectCount(value: unknown, what: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${what}: expected a positive integer, got ${JSON.stringify(value)}`);
  }
  return value;
}
