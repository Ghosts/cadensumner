import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { roles } from "@/content/experience";
import { profile } from "@/content/profile";
import { projects } from "@/content/work";
import { resolveFacts } from "@/facts/store";
import { formatPeriod, prefersMarkdown, renderHomeMarkdown } from "@/lib/markdown";
import { jsonResume } from "@/lib/structured-data";
import { hexToRgb } from "@/scripts/motion";

/** WCAG 2 contrast ratio between two #rrggbb colors. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = hexToRgb(hex).map((c) =>
      c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (bl ?? 0);
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

/** The color seen when `top` at the given opacity sits over `under`. */
function blend(top: string, under: string, opacity: number): string {
  const mixed = hexToRgb(top).map(
    (c, i) => c * opacity + (hexToRgb(under)[i] ?? 0) * (1 - opacity),
  );
  return `#${mixed
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** Cards are tinted glass: this much of the card color, the rest is whatever the canvas shows. */
const CARD_OPACITY = 0.84;

describe("project cards", () => {
  it.each(projects.map((p) => [p.name, p] as const))(
    "%s text passes WCAG AA whatever shows through the card",
    (_name, project) => {
      for (const behind of ["#000000", "#ffffff"]) {
        const surface = blend(project.surface, behind, CARD_OPACITY);
        expect(contrast(surface, project.ink)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it("links every project to an https site and gives it a logo", () => {
    for (const project of projects) {
      expect(project.url).toMatch(/^https:\/\//);
      expect(existsSync(`public/logos/${project.logo}`)).toBe(true);
    }
  });
});

describe("markdown version", () => {
  const markdown = renderHomeMarkdown(resolveFacts(null));

  it("carries the same projects, roles and links as the page", () => {
    for (const project of projects) expect(markdown).toContain(`[${project.name}](${project.url})`);
    for (const role of roles) expect(markdown).toContain(role.company);
    for (const link of profile.links) expect(markdown).toContain(link.url);
  });

  it("cites a source next to each number", () => {
    expect(markdown).toMatch(/32,606 servers listed \(\[source\]\(https:\/\/allmcps\.com/);
  });
});

describe("prefersMarkdown", () => {
  it.each([
    ["text/markdown", true],
    ["text/markdown, text/html;q=0.8", true],
    ["text/html, text/markdown;q=0.5", false],
    ["text/html,application/xhtml+xml,*/*;q=0.8", false],
    ["*/*", false],
    [null, false],
  ])("Accept: %s -> %s", (accept, expected) => {
    expect(prefersMarkdown(accept)).toBe(expected);
  });
});

describe("resume", () => {
  it("lists roles newest first, with the current role open-ended", () => {
    const starts = roles.map((role) => role.start);
    expect(starts).toEqual([...starts].sort().reverse());
    expect(jsonResume().work[0]).not.toHaveProperty("endDate");
    expect(formatPeriod("2021-08", "2023-11")).toBe("2021 to 2023");
    expect(formatPeriod("2023-11")).toBe("2023 to present");
  });
});
