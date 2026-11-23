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
  /** Scale of the name. Grows fast near the end so the camera passes through a letter. */
  scale: number;
  /** Opacity of the black layer the name is cut from. */
  maskOpacity: number;
  /** Opacity of the intro text and scroll cue. */
  metaOpacity: number;
  /** Canvas brightness. Full inside the letters, dimmed once text sits on top of it. */
  brightness: number;
}

const MAX_ZOOM = 90;
const READING_BRIGHTNESS = 0.38;

/** Where the hero is for a scroll progress of 0 (top of page) to 1 (hero finished). */
export function heroState(progress: number): HeroState {
  const p = clamp(progress);
  return {
    scale: 1 + p ** 3 * MAX_ZOOM,
    maskOpacity: 1 - smoothstep(0.5, 0.86, p),
    metaOpacity: 1 - smoothstep(0.04, 0.3, p),
    brightness: 1 - (1 - READING_BRIGHTNESS) * smoothstep(0.55, 1, p),
  };
}

/** How far an element has scrolled through a range, as 0 to 1. */
export function progressThrough(position: number, start: number, end: number): number {
  return clamp((position - start) / (end - start));
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
