import { cellPhase, clamp } from "./motion";

/**
 * Draws the hero name as a grid of characters and dissolves it as the page
 * scrolls. The name is first rebuilt from solid cells, the cells turn into
 * characters that keep changing, and then they drop out until nothing is left.
 *
 * The real heading stays in the page for screen readers and for anyone without
 * motion; this canvas only replaces how it looks during the scroll.
 */

/** Characters a cell cycles through once it stops being solid. */
const GLYPHS = "@#%&$8XW0/\\<>{}[]=+*;:~";
/** How often (ms) the characters change. */
const TICK = 60;
/** A cell is part of the name when at least this much of it is covered by a letter. */
const MIN_COVERAGE = 0.3;
/** Cell height as a fraction of the viewport width, and its limits in CSS pixels. */
const CELL_SCALE = 1 / 105;
const CELL_MIN = 8;
const CELL_MAX = 15;
/** Width of a cell relative to its height, close to a monospace character. */
const CELL_ASPECT = 0.62;
const MAX_PIXEL_RATIO = 2;
const MONOSPACE = 'ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace';

/** CSS `font-stretch` keywords, which is the only way a canvas font can name a width. */
const STRETCH_KEYWORDS: readonly (readonly [number, string])[] = [
  [50, "ultra-condensed"],
  [62.5, "extra-condensed"],
  [75, "condensed"],
  [87.5, "semi-condensed"],
  [100, "normal"],
  [112.5, "semi-expanded"],
  [125, "expanded"],
  [150, "extra-expanded"],
];

interface Cell {
  x: number;
  y: number;
  /** Two fixed random numbers: when the cell turns into a character, and when it drops out. */
  turn: number;
  drop: number;
}

export interface AsciiName {
  /** Measures the heading again. Call after fonts load and when the window changes size. */
  measure(): void;
  /** `dissolve` runs 0 (whole name) to 1 (gone). `opacity` fades the whole layer in. */
  draw(dissolve: number, opacity: number, now: number): void;
}

/** A repeatable random number in 0..1 for a pair of integers. */
function hash(a: number, b: number): number {
  const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function stretchKeyword(percent: number): string {
  let best = STRETCH_KEYWORDS[4] as readonly [number, string];
  for (const entry of STRETCH_KEYWORDS) {
    if (Math.abs(entry[0] - percent) < Math.abs(best[0] - percent)) best = entry;
  }
  return best[1];
}

/**
 * @param canvas fills the hero and sits over the heading
 * @param heading the real name
 * @param lines one element per line of the name, each ending in a `[data-baseline]` marker
 */
export function createAsciiName(
  canvas: HTMLCanvasElement,
  heading: HTMLElement,
  lines: readonly HTMLElement[],
): AsciiName | null {
  const drawing = canvas.getContext("2d");
  const sampling = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!drawing || !sampling) return null;
  const context = drawing;
  const sampler = sampling;

  let cells: Cell[] = [];
  let cellWidth = 0;
  let cellHeight = 0;
  let pixelRatio = 1;
  let lastKey = "";

  /** Paints the name into an offscreen canvas exactly where the heading shows it. */
  function paintName(width: number, height: number) {
    const frame = canvas.getBoundingClientRect();
    const style = getComputedStyle(heading);
    const stretch = stretchKeyword(Number(style.getPropertyValue("--stretch")) || 100);
    sampler.canvas.width = width;
    sampler.canvas.height = height;
    sampler.clearRect(0, 0, width, height);
    sampler.font = `${style.fontWeight} ${stretch} ${style.fontSize} ${style.fontFamily}`;
    sampler.textBaseline = "alphabetic";
    sampler.fillStyle = "#fff";
    for (const line of lines) {
      const text = (line.textContent ?? "").trim().toUpperCase();
      const box = line.getBoundingClientRect();
      const baseline = line.querySelector("[data-baseline]")?.getBoundingClientRect().bottom;
      const measured = sampler.measureText(text).width;
      if (!text || !measured || baseline === undefined) continue;
      // Stretch the line to the heading's real width, so small font differences cannot shift it.
      sampler.save();
      sampler.translate(box.left - frame.left, baseline - frame.top);
      sampler.scale(box.width / measured, 1);
      sampler.fillText(text, 0, 0);
      sampler.restore();
    }
  }

  function measure() {
    const width = Math.round(canvas.clientWidth);
    const height = Math.round(canvas.clientHeight);
    if (!width || !height) return;
    pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    cellHeight = clamp(width * CELL_SCALE, CELL_MIN, CELL_MAX);
    cellWidth = cellHeight * CELL_ASPECT;

    paintName(width, height);
    const pixels = sampler.getImageData(0, 0, width, height).data;
    cells = [];
    const columns = Math.ceil(width / cellWidth);
    const rows = Math.ceil(height / cellHeight);
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        if (coverage(pixels, width, height, column, row) < MIN_COVERAGE) continue;
        cells.push({
          x: column * cellWidth,
          y: row * cellHeight,
          turn: hash(column, row),
          drop: hash(row + 17, column + 31),
        });
      }
    }
    lastKey = "";
  }

  /** How much of one cell the letters cover, 0 to 1, from a few sample points. */
  function coverage(
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
    column: number,
    row: number,
  ): number {
    let total = 0;
    let count = 0;
    for (let sy = 0.2; sy < 1; sy += 0.3) {
      for (let sx = 0.25; sx < 1; sx += 0.5) {
        const x = Math.min(width - 1, Math.floor((column + sx) * cellWidth));
        const y = Math.min(height - 1, Math.floor((row + sy) * cellHeight));
        total += (pixels[(y * width + x) * 4 + 3] ?? 0) / 255;
        count++;
      }
    }
    return total / count;
  }

  function draw(dissolve: number, opacity: number, now: number) {
    const tick = Math.floor(now / TICK);
    const visible = opacity > 0 && dissolve < 1;
    // Nothing changes between ticks unless the scroll position did.
    const key = visible ? `${dissolve.toFixed(4)}:${opacity.toFixed(3)}:${tick}` : "hidden";
    if (key === lastKey) return;
    lastKey = key;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    if (!visible) return;

    context.fillStyle = "#fff";
    context.font = `700 ${cellHeight * 1.08}px ${MONOSPACE}`;
    context.textBaseline = "top";
    for (const [i, cell] of cells.entries()) {
      const phase = cellPhase(dissolve, cell.turn, cell.drop);
      if (phase.gone) continue;
      context.globalAlpha = opacity * phase.opacity;
      if (phase.solid) {
        // A hair larger than the cell so neighbours join without seams.
        context.fillRect(cell.x, cell.y, cellWidth + 0.5, cellHeight + 0.5);
        continue;
      }
      // Each cell changes on its own beat, and faster as it gets close to dropping out.
      const beat = Math.floor((tick + i) / phase.hold);
      const glyph = GLYPHS[Math.floor(hash(i, beat) * GLYPHS.length)] ?? "#";
      context.fillText(glyph, cell.x, cell.y + phase.fall * cellHeight);
    }
    context.globalAlpha = 1;
  }

  return { measure, draw };
}
