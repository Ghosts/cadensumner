import { describe, expect, it } from "vitest";
import {
  approach,
  cellPhase,
  heroState,
  hexToRgb,
  progressThrough,
  scrollEnergy,
  smoothstep,
} from "@/scripts/motion";

describe("heroState", () => {
  it("starts at rest with everything visible", () => {
    expect(heroState(0)).toEqual({
      nameOpacity: 1,
      gridOpacity: 0,
      dissolve: 0,
      maskOpacity: 1,
      metaOpacity: 1,
      brightness: 1,
    });
  });

  it("ends with the name dissolved, the mask gone and the canvas dimmed for reading", () => {
    const end = heroState(1);
    expect(end.dissolve).toBe(1);
    expect(end.nameOpacity).toBe(0);
    expect(end.maskOpacity).toBe(0);
    expect(end.metaOpacity).toBe(0);
    expect(end.brightness).toBeLessThan(0.5);
  });

  it("hides the intro text before the mask starts to fade", () => {
    const early = heroState(0.35);
    expect(early.metaOpacity).toBe(0);
    expect(early.maskOpacity).toBe(1);
  });

  it("shows the character grid before the heading fades, so the name never blinks out", () => {
    for (let p = 0; p <= 0.2; p += 0.01) {
      const state = heroState(p);
      expect(Math.max(state.nameOpacity, state.gridOpacity)).toBe(1);
    }
  });

  it("finishes the dissolve before the mask is gone", () => {
    expect(heroState(0.7).dissolve).toBe(1);
    expect(heroState(0.7).maskOpacity).toBeGreaterThan(0);
  });

  it("treats out-of-range progress as the nearest end", () => {
    expect(heroState(-2)).toEqual(heroState(0));
    expect(heroState(5)).toEqual(heroState(1));
  });
});

describe("cellPhase", () => {
  it("starts every cell solid and ends with every cell gone", () => {
    for (const seed of [0, 0.25, 0.5, 0.75, 1]) {
      expect(cellPhase(0, seed, seed)).toMatchObject({ gone: false, opacity: 1, fall: 0 });
      expect(cellPhase(1, seed, seed).gone).toBe(true);
    }
    expect(cellPhase(0, 0.5, 0.5).solid).toBe(true);
  });

  it("turns a cell into a character before it drops out", () => {
    const [turn, drop] = [1, 0];
    const justBeforeDrop = cellPhase(0.27, turn, drop);
    expect(justBeforeDrop.gone).toBe(false);
    expect(cellPhase(0.31, turn, 1).solid).toBe(false);
  });

  it("fades and slips a cell as it drops out", () => {
    const leaving = cellPhase(0.6, 0.2, 0.5);
    expect(leaving.gone).toBe(false);
    expect(leaving.opacity).toBeLessThan(1);
    expect(leaving.fall).toBeGreaterThan(0);
    expect(leaving.hold).toBe(1);
  });
});

describe("scrollEnergy", () => {
  it("rises with scroll speed in either direction and is capped", () => {
    expect(scrollEnergy(0, 0.02)).toBeGreaterThan(0.05);
    expect(scrollEnergy(0, -0.02)).toBe(scrollEnergy(0, 0.02));
    expect(scrollEnergy(0, 5)).toBeLessThanOrEqual(1);
  });

  it("settles back to calm when scrolling stops", () => {
    let energy = 1;
    for (let frame = 0; frame < 60; frame++) energy = scrollEnergy(energy, 0);
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
