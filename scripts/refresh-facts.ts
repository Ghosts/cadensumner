/**
 * Prints each live fact next to the value committed in src/facts/registry.ts.
 * Run with `bun run facts` before updating the committed fallbacks.
 * Set GITHUB_TOKEN to include the GitHub contribution count.
 */
import { facts } from "../src/facts/registry";
import { refreshFacts } from "../src/facts/store";
import type { Fact } from "../src/facts/types";

const snapshot = await refreshFacts({ GITHUB_TOKEN: process.env.GITHUB_TOKEN });
const entries: [string, Fact][] = Object.entries(facts);

console.table(
  entries.map(([id, fact]) => ({
    fact: id,
    committed: fact.value,
    live: snapshot.values[id] ?? (fact.refresh ? "not refreshed" : "static"),
    checked: fact.asOf,
    source: fact.source,
  })),
);
