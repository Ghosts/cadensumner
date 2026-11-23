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
} from "./motion";

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
  const zoomTarget = select<HTMLElement>("[data-zoom-target]");
  const statement = select<HTMLElement>("[data-statement]");
  const words = [...statement.querySelectorAll<HTMLElement>("[data-word]")];
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

  /** Zoom toward the middle of one letter's stem, so the camera ends up inside the letter. */
  function aimZoom() {
    const name = heroName.getBoundingClientRect();
    const target = zoomTarget.getBoundingClientRect();
    const scale = name.width / heroName.offsetWidth || 1;
    const x = (target.left + target.width * 0.46 - name.left) / scale;
    const y = (target.top + target.height * 0.5 - name.top) / scale;
    heroName.style.transformOrigin = `${x}px ${y}px`;
  }

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
  function updateHero(viewportHeight: number): number {
    const rect = hero.getBoundingClientRect();
    const state = heroState(progressThrough(-rect.top, 0, rect.height - viewportHeight));
    if (!animate) return rect.bottom > viewportHeight / 2 ? 1 : state.brightness;
    heroName.style.transform = `scale(${state.scale})`;
    heroMask.style.opacity = String(state.maskOpacity);
    heroMeta.style.opacity = String(state.metaOpacity);
    heroMeta.style.visibility = state.metaOpacity < 0.01 ? "hidden" : "visible";
    return state.brightness;
  }

  function updateStatement(viewportHeight: number) {
    const rect = statement.getBoundingClientRect();
    const lit = progressThrough(
      viewportHeight * 0.8 - rect.top,
      0,
      rect.height + viewportHeight * 0.25,
    );
    for (const [i, word] of words.entries()) {
      word.classList.toggle("is-lit", i / words.length < lit);
    }
  }

  /** Each card shrinks and darkens as the next one slides over it. */
  function updateCards(viewportHeight: number) {
    for (const [i, card] of cards.entries()) {
      const rect = card.getBoundingClientRect();
      card.classList.toggle("is-active", rect.top < viewportHeight * 0.6);
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
    const heroBrightness = updateHero(viewportHeight);
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
    aimZoom();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) requestAnimationFrame(frame);
  });
  // Motion preferences can change while the page is open. Reloading is the simple, correct reset.
  reducedMotion.addEventListener("change", () => window.location.reload());

  document.fonts.ready.then(aimZoom);
  aimZoom();
  requestAnimationFrame(frame);

  // The CSS gradient is already on screen. Swap in the shader once the page is settled.
  whenIdle(() => {
    fluid = createFluid(select<HTMLCanvasElement>("[data-fluid]"));
    if (fluid) root.classList.add("has-fluid");
  });
}

start();
