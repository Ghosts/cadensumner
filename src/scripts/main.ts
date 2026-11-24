import { type AsciiName, createAsciiName } from "./ascii";
import { createFluid, type Fluid } from "./fluid/renderer";
import {
  approach,
  clamp,
  heroState,
  hexToRgb,
  progressThrough,
  READING_BRIGHTNESS,
  type Rgb,
  scrollEnergy,
  smoothstep,
} from "./motion";
import { registerPageTools } from "./webmcp";

/**
 * Wires the scroll choreography to the page. One animation frame loop reads the
 * scroll position and writes styles; all the math lives in ./motion.
 *
 * Nothing here is required to read the page. Without JavaScript, or with reduced
 * motion, the hero is an ordinary full-height section and every word is visible.
 */

type Palette = [Rgb, Rgb, Rgb];

/** A section that sets the mood of the canvas while it is on screen. */
interface Scene {
  element: HTMLElement;
  palette: Palette;
  /** Canvas brightness for this section. Sections with text directly on the canvas keep it low. */
  brightness: number;
}

/** Seconds of flow already "elapsed" at load, chosen because the field looks good there. */
const TIME_OFFSET = 12;
/** On devices that cannot animate the field, redraw it at most this often (ms) while scrolling. */
const STILL_REDRAW_INTERVAL = 250;
/** Field turbulence at rest, and how much scrolling adds to it. */
const BASE_WARP = 3.4;
const SCROLL_WARP = 0.25;
/** How many times faster the field flows at full scroll energy. */
const SCROLL_SPEED_UP = 1.2;
/**
 * How much of the way the hero moves toward the scroll position each frame. The
 * hero is short, so one flick of the wheel can cross all of it; easing plays the
 * dissolve out over about half a second instead of jumping to the end.
 */
const HERO_EASE = 0.085;

const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function select<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

function parsePalette(element: HTMLElement): Palette {
  const colors = (element.dataset.palette ?? "").split(",").map(hexToRgb);
  if (colors.length !== 3) {
    throw new Error(`data-palette needs three colors: ${element.dataset.palette}`);
  }
  return colors as Palette;
}

/** Runs `task` once the page has loaded and the browser is idle, so it never delays first paint. */
function whenIdle(task: () => void) {
  const schedule = () => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(task, { timeout: 2000 });
    else setTimeout(task, 200);
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}

function start() {
  const hero = select<HTMLElement>("[data-hero]");
  const heroMask = select<HTMLElement>("[data-hero-mask]");
  const heroName = select<HTMLElement>("[data-hero-name]");
  const heroMeta = select<HTMLElement>("[data-hero-meta]");
  const heroLines = [...heroName.querySelectorAll<HTMLElement>("[data-hero-line]")];
  const sentence = select<HTMLElement>("[data-statement]");
  const statement = select<HTMLElement>("#intro");
  const words = [...sentence.querySelectorAll<HTMLElement>("[data-word]")];
  const cards = [...document.querySelectorAll<HTMLElement>("[data-card]")];
  const heroPalette = parsePalette(hero);
  const scenes: Scene[] = [...document.querySelectorAll<HTMLElement>("[data-palette]")]
    .filter((element) => element !== hero)
    .map((element) => ({
      element,
      palette: parsePalette(element),
      brightness: Number(element.dataset.brightness ?? READING_BRIGHTNESS),
    }));

  const animate = !reducedMotion.matches;
  if (animate) root.classList.add("motion");

  let fluid: Fluid | null = null;
  let colors: Palette = heroPalette;
  let brightness = 1;
  let pointer: [number, number] = [0, 0];
  let pointerTarget: [number, number] = [0, 0];
  let lastStillDraw = 0;
  let lastFrame = 0;
  let lastScrollY = window.scrollY;
  let energy = 0;
  let flowTime = TIME_OFFSET;
  /** Where the hero animation is, which trails the scroll position. Unset until the first frame. */
  let heroProgress: number | null = null;

  /** The name redrawn as a grid of characters, which dissolves as the hero scrolls. */
  const ascii: AsciiName | null = animate
    ? createAsciiName(select<HTMLCanvasElement>("[data-hero-ascii]"), heroName, heroLines)
    : null;

  /** The last section whose body is in the middle of the screen, if any. */
  function activeScene(viewportHeight: number): Scene | undefined {
    let active: Scene | undefined;
    for (const scene of scenes) {
      const rect = scene.element.getBoundingClientRect();
      if (rect.top < viewportHeight * 0.55 && rect.bottom > viewportHeight * 0.2) active = scene;
    }
    return active;
  }

  /** Returns how bright the canvas should be for the hero: full inside the name, dimmed after. */
  function updateHero(viewportHeight: number, now: number): number {
    const rect = hero.getBoundingClientRect();
    const target = progressThrough(-rect.top, 0, rect.height - viewportHeight);
    if (!animate) return rect.bottom > viewportHeight / 2 ? 1 : heroState(target).brightness;
    // The first frame starts where the page is, so a reload part-way down does not replay it.
    const previous = heroProgress ?? target;
    const eased = previous + (target - previous) * HERO_EASE;
    heroProgress = Math.abs(target - eased) < 0.001 ? target : eased;
    const state = heroState(heroProgress);
    // Without the grid the heading simply fades out with the mask.
    heroName.style.opacity = String(ascii ? state.nameOpacity : 1);
    ascii?.draw(state.dissolve, state.gridOpacity, now);
    heroMask.style.opacity = String(state.maskOpacity);
    heroMeta.style.opacity = String(state.metaOpacity);
    heroMeta.style.visibility = state.metaOpacity < 0.01 ? "hidden" : "visible";
    return state.brightness;
  }

  /**
   * The sentence fades and rises in as it comes up from the bottom of the screen,
   * and its words light up one by one until it is near the top.
   */
  function updateStatement(viewportHeight: number) {
    const textTop = sentence.offsetTop + statement.getBoundingClientRect().top;
    const entered = smoothstep(viewportHeight, viewportHeight * 0.62, textTop);
    statement.style.setProperty("--enter", entered.toFixed(3));
    const lit = progressThrough(viewportHeight * 0.85 - textTop, 0, viewportHeight * 0.63);
    for (const [i, word] of words.entries()) {
      word.classList.toggle("is-lit", i / words.length < lit);
    }
  }

  /** Each card shrinks and darkens as the next one slides over it. */
  function updateCards(viewportHeight: number) {
    for (const [i, card] of cards.entries()) {
      const rect = card.getBoundingClientRect();
      card.classList.toggle("is-active", rect.top < viewportHeight * 0.85);
      const next = cards[i + 1]?.getBoundingClientRect();
      const covered = next ? clamp(1 - (next.top - rect.top) / rect.height) : 0;
      card.style.setProperty("--covered", covered.toFixed(3));
    }
  }

  /** Scrolling stirs the field: it flows faster and folds harder, then settles. */
  function updateFlow(now: number, viewportHeight: number) {
    const elapsed = lastFrame ? Math.min(now - lastFrame, 100) / 1000 : 0;
    lastFrame = now;
    energy = scrollEnergy(energy, (window.scrollY - lastScrollY) / viewportHeight);
    lastScrollY = window.scrollY;
    flowTime += elapsed * (1 + energy * SCROLL_SPEED_UP);
  }

  function drawFluid(now: number, heroBrightness: number, viewportHeight: number) {
    if (!fluid) return;
    const flowing = animate && fluid.canAnimate;
    if (!flowing && now - lastStillDraw < STILL_REDRAW_INTERVAL) return;
    lastStillDraw = now;

    const scene = activeScene(viewportHeight);
    const targetColors = scene?.palette ?? heroPalette;
    const targetBrightness = scene?.brightness ?? heroBrightness;
    // A still frame jumps straight to the section's look; a flowing one eases toward it.
    if (flowing) {
      colors = colors.map((color, i) => approach(color, targetColors[i] ?? color, 0.05)) as Palette;
      brightness += (targetBrightness - brightness) * 0.08;
      pointer = [
        pointer[0] + (pointerTarget[0] - pointer[0]) * 0.06,
        pointer[1] + (pointerTarget[1] - pointer[1]) * 0.06,
      ];
    } else {
      colors = targetColors;
      brightness = targetBrightness;
    }

    fluid.draw({
      time: flowing ? flowTime : TIME_OFFSET,
      pointer: flowing ? pointer : [0, 0],
      warp: flowing ? BASE_WARP + energy * SCROLL_WARP : BASE_WARP,
      brightness,
      colors,
    });
  }

  function frame(now: number) {
    const viewportHeight = window.innerHeight;
    const heroBrightness = updateHero(viewportHeight, now);
    if (animate) {
      updateStatement(viewportHeight);
      updateCards(viewportHeight);
      updateFlow(now, viewportHeight);
    }
    drawFluid(now, heroBrightness, viewportHeight);
    if (!document.hidden) requestAnimationFrame(frame);
  }

  window.addEventListener("pointermove", (event) => {
    // A finger landing on the screen is a jump, not a glide, so only a mouse bends the field.
    if (event.pointerType !== "mouse") return;
    pointerTarget = [
      (event.clientX - window.innerWidth / 2) / window.innerHeight,
      -(event.clientY - window.innerHeight / 2) / window.innerHeight,
    ];
  });
  window.addEventListener("resize", () => {
    fluid?.resize();
    lastStillDraw = 0;
    ascii?.measure();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) requestAnimationFrame(frame);
  });
  // Motion preferences can change while the page is open. Reloading is the simple, correct reset.
  reducedMotion.addEventListener("change", () => window.location.reload());

  // The grid is traced from the heading, so it has to wait for the display font.
  document.fonts.ready.then(() => ascii?.measure());
  requestAnimationFrame(frame);

  // The CSS gradient is already on screen. Swap in the shader once the page is settled.
  whenIdle(() => {
    fluid = createFluid(select<HTMLCanvasElement>("[data-fluid]"));
    if (fluid) root.classList.add("has-fluid");
    // Tools for an AI agent driving this tab. Optional, so a failure is only logged.
    registerPageTools().catch((error) => console.warn("WebMCP tools were not registered:", error));
  });
}

start();
