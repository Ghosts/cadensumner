import { afterEach, describe, expect, it, vi } from "vitest";
import { projects } from "@/content/work";
import { facts } from "@/facts/registry";
import { expectCount, parseAllMcpsServerCount } from "@/facts/sources";
import {
  type FactStorage,
  formatFact,
  loadSnapshot,
  refreshFacts,
  resolveFacts,
} from "@/facts/store";
import type { Fact } from "@/facts/types";

const allFacts: [string, Fact][] = Object.entries(facts);

describe("facts registry", () => {
  it.each(allFacts)("%s has a checkable source and a verified value", (_id, fact) => {
    expect(fact.source).toMatch(/^https:\/\//);
    expect(fact.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isInteger(fact.value) && fact.value > 0).toBe(true);
    expect(fact.label.length).toBeGreaterThan(0);
  });

  it("backs every project card with a registered fact", () => {
    for (const project of projects) expect(facts).toHaveProperty(project.fact);
  });
});

describe("resolveFacts", () => {
  it("uses committed values when nothing has been refreshed", () => {
    expect(resolveFacts(null).allMcpsServers.value).toBe(facts.allMcpsServers.value);
  });

  it("prefers refreshed values and ignores unusable ones", () => {
    const resolved = resolveFacts({
      refreshedAt: "2026-12-01T00:00:00.000Z",
      values: { allMcpsServers: 40000, githubContributions: 0 },
    });
    expect(resolved.allMcpsServers.text).toBe("40,000");
    expect(resolved.githubContributions.value).toBe(facts.githubContributions.value);
  });

  it("formats ranks with a leading #", () => {
    expect(formatFact(7, "rank")).toBe("#7");
    expect(formatFact(32606)).toBe("32,606");
  });
});

describe("refreshFacts", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the sources that worked when another one fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("allmcps.com")
          ? new Response("- **Total MCP Servers:** 33,001 (as of today)")
          : new Response("unavailable", { status: 503 }),
      ),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const snapshot = await refreshFacts({}, new Date("2026-12-01T00:00:00Z"));

    expect(snapshot.values).toEqual({ allMcpsServers: 33001 });
    expect(snapshot.refreshedAt).toBe("2026-12-01T00:00:00.000Z");
  });
});

describe("loadSnapshot", () => {
  it("returns null when storage throws or holds something else", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const broken: FactStorage = {
      get: () => Promise.reject(new Error("KV is down")),
      put: () => Promise.resolve(),
    };
    const wrongShape: FactStorage = { ...broken, get: () => Promise.resolve("not a snapshot") };

    expect(await loadSnapshot(broken)).toBeNull();
    expect(await loadSnapshot(wrongShape)).toBeNull();
    expect(await loadSnapshot(undefined)).toBeNull();
  });
});

describe("source parsing", () => {
  it("reads the server count from the AllMCPs llms.txt", () => {
    expect(parseAllMcpsServerCount("- **Total MCP Servers:** 32606 (as of Nov 23)")).toBe(32606);
  });

  it("rejects values that are not positive integers", () => {
    expect(() => parseAllMcpsServerCount("no count here")).toThrow(/positive integer/);
    expect(() => expectCount(undefined, "x")).toThrow();
    expect(() => expectCount(1.5, "x")).toThrow();
  });
});
