/** Pure math for the scroll choreography. No DOM here, so it can be unit tested. */

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/** 0 below `from`, 1 above `to`, eased in between. */
export function smoothstep(from: number, to: number, value: number): number {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}

export interface HeroState {
  /** Opacity of the real heading. It hands over to the character grid early in the scroll. */
  nameOpacity: number;
  /** Opacity of the character grid drawn over the heading. */
  gridOpacity: number;
  /** How far the grid has dissolved: 0 is the whole name, 1 is nothing left. */
  dissolve: number;
  /** Opacity of the black layer the name is cut from. */
  maskOpacity: number;
  /** Opacity of the intro text and scroll cue. */
  metaOpacity: number;
  /** Canvas brightness. Full inside the letters, dimmed once text sits on top of it. */
  brightness: number;
}

/** Canvas brightness under body text, where white type has to stay readable. */
export const READING_BRIGHTNESS = 0.38;

/** Where the hero is for a scroll progress of 0 (top of page) to 1 (hero finished). */
export function heroState(progress: number): HeroState {
  const p = clamp(progress);
  return {
    nameOpacity: 1 - smoothstep(0.08, 0.14, p),
    gridOpacity: smoothstep(0.02, 0.08, p),
    dissolve: progressThrough(p, 0.08, 0.7),
    maskOpacity: 1 - smoothstep(0.5, 0.82, p),
    metaOpacity: 1 - smoothstep(0.04, 0.3, p),
    brightness: 1 - (1 - READING_BRIGHTNESS) * smoothstep(0.45, 0.9, p),
  };
}

export interface CellPhase {
  /** The cell has dropped out and draws nothing. */
  gone: boolean;
  /** The cell is still a solid block, not yet a character. */
  solid: boolean;
  opacity: number;
  /** How far the character has slipped down as it drops out, in cell heights. */
  fall: number;
  /** How many ticks a character is held before it changes. */
  hold: number;
}

/** The last cell turns into a character by this point in the dissolve. */
const TURN_SPAN = 0.3;
/** Cells drop out between these two points. */
const DROP_START = 0.28;
const DROP_END = 0.97;
/** How long before dropping out a cell starts to fade and slip. */
const DROP_FADE = 0.07;

/**
 * What one cell of the name looks like at a point in the dissolve. `turn` and
 * `drop` are the cell's own random numbers (0..1), so cells change one by one.
 */
export function cellPhase(dissolve: number, turn: number, drop: number): CellPhase {
  const dropAt = DROP_START + drop * (DROP_END - DROP_START);
  const remaining = clamp((dropAt - dissolve) / DROP_FADE);
  return {
    gone: dissolve >= dropAt,
    solid: dissolve < turn * TURN_SPAN,
    opacity: remaining,
    fall: (1 - remaining) * 1.5,
    hold: remaining < 1 ? 1 : dissolve > 0.45 ? 2 : 5,
  };
}

/** How far an element has scrolled through a range, as 0 to 1. */
export function progressThrough(position: number, start: number, end: number): number {
  return clamp((position - start) / (end - start));
}

/**
 * How stirred up the field is, from how fast the page is scrolling. Rises with
 * scroll speed and decays on its own, so the background picks up a little while
 * you scroll and settles when you stop. Kept gentle on purpose: a strong
 * response reads as the whole screen lurching.
 *
 * @param energy current energy, 0 (calm) to 1 (fully stirred)
 * @param scrolled distance scrolled this frame, as a fraction of the viewport height
 */
export function scrollEnergy(energy: number, scrolled: number): number {
  const pushed = Math.max(energy, clamp(Math.abs(scrolled) * 6));
  return pushed * 0.9;
}

export type Rgb = [number, number, number];

/** "#rrggbb" to components in 0..1, the form WebGL uniforms take. */
export function hexToRgb(hex: string): Rgb {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!match) throw new Error(`Not a #rrggbb color: "${hex}"`);
  const [, r, g, b] = match as unknown as [string, string, string, string];
  return [r, g, b].map((channel) => Number.parseInt(channel, 16) / 255) as Rgb;
}

/** Moves `current` a fraction of the way toward `target`. Called once per frame. */
export function approach(current: Rgb, target: Rgb, rate: number): Rgb {
  return current.map((value, i) => value + ((target[i] ?? value) - value) * rate) as Rgb;
}
