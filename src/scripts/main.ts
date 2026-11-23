import { createFluid, type Fluid } from "./fluid/renderer";
import { approach, clamp, heroState, hexToRgb, progressThrough, type Rgb } from "./motion";

/**
 * Wires the scroll choreography to the page. One animation frame loop reads the
 * scroll position and writes styles; all the math lives in ./motion.
 *
 * Nothing here is required to read the page. Without JavaScript, or with reduced
 * motion, the hero is an ordinary full-height section and every word is visible.
 */

type Palette = [Rgb, Rgb, Rgb];

/** Seconds of flow already "elapsed" at load, chosen because the field looks good there. */
const TIME_OFFSET = 12;
/** On devices that cannot animate the field, redraw it at most this often (ms) while scrolling. */
const STILL_REDRAW_INTERVAL = 250;

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
  const paletteSections = [...document.querySelectorAll<HTMLElement>("[data-palette]")].map(
    (element) => ({ element, palette: parsePalette(element) }),
  );
  const heroPalette = parsePalette(hero);

  const animate = !reducedMotion.matches;
  if (animate) root.classList.add("motion");

  let fluid: Fluid | null = null;
  let colors: Palette = heroPalette;
  let pointer: [number, number] = [0, 0];
  let pointerTarget: [number, number] = [0, 0];
  let lastStillDraw = 0;

  /** Zoom toward the middle of one letter's stem, so the camera ends up inside the letter. */
  function aimZoom() {
    const name = heroName.getBoundingClientRect();
    const target = zoomTarget.getBoundingClientRect();
    const scale = name.width / heroName.offsetWidth || 1;
    const x = (target.left + target.width * 0.46 - name.left) / scale;
    const y = (target.top + target.height * 0.5 - name.top) / scale;
    heroName.style.transformOrigin = `${x}px ${y}px`;
  }

  function activePalette(viewportHeight: number): Palette {
    let active = heroPalette;
    for (const { element, palette } of paletteSections) {
      const rect = element.getBoundingClientRect();
      if (rect.top < viewportHeight * 0.55 && rect.bottom > viewportHeight * 0.2) active = palette;
    }
    return active;
  }

  /** Returns how bright the canvas should be: full inside the name, dimmed under text. */
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

  function drawFluid(now: number, brightness: number, viewportHeight: number) {
    if (!fluid) return;
    const flowing = animate && fluid.canAnimate;
    if (!flowing && now - lastStillDraw < STILL_REDRAW_INTERVAL) return;
    lastStillDraw = now;

    const target = activePalette(viewportHeight);
    // A still frame jumps straight to the section's colors; a flowing one eases toward them.
    colors = flowing
      ? (colors.map((color, i) => approach(color, target[i] ?? color, 0.04)) as Palette)
      : target;
    pointer = pointer.map((value, i) => value + ((pointerTarget[i] ?? 0) - value) * 0.06) as [
      number,
      number,
    ];
    fluid.draw({
      time: flowing ? now / 1000 + TIME_OFFSET : TIME_OFFSET,
      pointer: flowing ? pointer : [0, 0],
      brightness,
      colors,
    });
  }

  function frame(now: number) {
    const viewportHeight = window.innerHeight;
    const brightness = updateHero(viewportHeight);
    if (animate) {
      updateStatement(viewportHeight);
      updateCards(viewportHeight);
    }
    drawFluid(now, brightness, viewportHeight);
    if (!document.hidden) requestAnimationFrame(frame);
  }

  window.addEventListener("pointermove", (event) => {
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
