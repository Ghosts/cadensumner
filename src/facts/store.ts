import { type FactId, facts } from "./registry";
import type { Fact, FactSnapshot, RefreshEnv } from "./types";

const SNAPSHOT_KEY = "facts:v1";

/** The slice of a KV namespace this module uses, so tests can pass a plain object. */
export interface FactStorage {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
}

export interface ResolvedFact {
  value: number;
  /** The number formatted for display, such as "32,606" or "#7". */
  text: string;
  label: string;
  source: string;
}

export type ResolvedFacts = Record<FactId, ResolvedFact>;

/**
 * Runs every refresher and returns the values that succeeded. A source that is
 * down is logged and skipped, so one bad upstream never blanks the others.
 */
export async function refreshFacts(env: RefreshEnv, now = new Date()): Promise<FactSnapshot> {
  const entries: [string, Fact][] = Object.entries(facts);
  const values: Record<string, number> = {};
  await Promise.all(
    entries.map(async ([id, fact]) => {
      if (!fact.refresh) return;
      try {
        values[id] = await fact.refresh(env);
      } catch (error) {
        console.warn(`fact "${id}" was not refreshed:`, error);
      }
    }),
  );
  return { refreshedAt: now.toISOString(), values };
}

export async function saveSnapshot(storage: FactStorage, snapshot: FactSnapshot): Promise<void> {
  await storage.put(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

/** Reads the last refreshed values. Returns nothing when storage is empty or unavailable. */
export async function loadSnapshot(storage: FactStorage | undefined): Promise<FactSnapshot | null> {
  try {
    const stored = await storage?.get(SNAPSHOT_KEY, "json");
    return isSnapshot(stored) ? stored : null;
  } catch (error) {
    console.warn("facts snapshot could not be read:", error);
    return null;
  }
}

/** Committed values with refreshed ones laid over the top, formatted for display. */
export function resolveFacts(snapshot: FactSnapshot | null): ResolvedFacts {
  const entries: [string, Fact][] = Object.entries(facts);
  return Object.fromEntries(
    entries.map(([id, fact]) => {
      const live = snapshot?.values[id];
      const value = typeof live === "number" && live > 0 ? live : fact.value;
      const resolved: ResolvedFact = {
        value,
        text: formatFact(value, fact.format),
        label: fact.label,
        source: fact.source,
      };
      return [id, resolved];
    }),
  ) as ResolvedFacts;
}

export function formatFact(value: number, format: Fact["format"] = "integer"): string {
  const grouped = new Intl.NumberFormat("en-US").format(value);
  return format === "rank" ? `#${grouped}` : grouped;
}

function isSnapshot(value: unknown): value is FactSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<FactSnapshot>;
  return typeof candidate.refreshedAt === "string" && typeof candidate.values === "object";
}
