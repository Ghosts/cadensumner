/**
 * A fact is a number shown on the site. Each one names where it came from, so a
 * reader (or a test) can check it. Facts with a `refresh` function are updated
 * on a schedule; the committed `value` is the fallback when that fails.
 */
export interface Fact {
  /** The number as last verified. */
  value: number;
  /** What the number counts, written to follow the number: "32,606 servers listed". */
  label: string;
  /** ISO date the committed value was checked. */
  asOf: string;
  /** Public page where the number can be confirmed. */
  source: string;
  /** How to display it. Defaults to a grouped integer. */
  format?: "integer" | "rank";
  /** Fetches the current value. Throws if the source cannot be read. */
  refresh?: (env: RefreshEnv) => Promise<number>;
}

/** Secrets a refresher may need. All optional: a missing one skips that fact. */
export interface RefreshEnv {
  GITHUB_TOKEN?: string | undefined;
}

/** What is stored in KV and merged over the committed values at request time. */
export interface FactSnapshot {
  refreshedAt: string;
  values: Record<string, number>;
}
