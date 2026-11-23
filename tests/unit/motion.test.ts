import { describe, expect, it } from "vitest";
import {
  approach,
  heroState,
  hexToRgb,
  progressThrough,
  scrollEnergy,
  smoothstep,
} from "@/scripts/motion";

describe("heroState", () => {
  it("starts at rest with everything visible", () => {
    expect(heroState(0)).toEqual({ scale: 1, maskOpacity: 1, metaOpacity: 1, brightness: 1 });
  });

  it("ends zoomed in, with the mask gone and the canvas dimmed for reading", () => {
    const end = heroState(1);
    expect(end.scale).toBeGreaterThan(50);
    expect(end.maskOpacity).toBe(0);
    expect(end.metaOpacity).toBe(0);
    expect(end.brightness).toBeLessThan(0.5);
  });

  it("hides the intro text before the mask starts to fade", () => {
    const early = heroState(0.35);
    expect(early.metaOpacity).toBe(0);
    expect(early.maskOpacity).toBe(1);
  });

  it("treats out-of-range progress as the nearest end", () => {
    expect(heroState(-2)).toEqual(heroState(0));
    expect(heroState(5)).toEqual(heroState(1));
  });
});

describe("scrollEnergy", () => {
  it("rises with scroll speed in either direction and is capped", () => {
    expect(scrollEnergy(0, 0.02)).toBeGreaterThan(0.3);
    expect(scrollEnergy(0, -0.02)).toBe(scrollEnergy(0, 0.02));
    expect(scrollEnergy(0, 5)).toBeLessThanOrEqual(1);
  });

  it("settles back to calm when scrolling stops", () => {
    let energy = 1;
    for (let frame = 0; frame < 120; frame++) energy = scrollEnergy(energy, 0);
    expect(energy).toBeLessThan(0.01);
  });
});

describe("helpers", () => {
  it("smoothstep is clamped and eased", () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });

  it("progressThrough maps a range to 0..1", () => {
    expect(progressThrough(150, 100, 200)).toBe(0.5);
    expect(progressThrough(50, 100, 200)).toBe(0);
  });

  it("hexToRgb converts and rejects bad input", () => {
    expect(hexToRgb("#ff0080")).toEqual([1, 0, 128 / 255]);
    expect(() => hexToRgb("red")).toThrow(/Not a #rrggbb/);
  });

  it("approach moves part of the way to the target", () => {
    expect(approach([0, 0, 0], [1, 1, 1], 0.25)).toEqual([0.25, 0.25, 0.25]);
  });
});
