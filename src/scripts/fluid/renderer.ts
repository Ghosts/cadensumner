import type { Rgb } from "../motion";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader";

interface FluidFrame {
  /** Seconds. Drives the flow. */
  time: number;
  /** Pointer position in the shader's coordinates (origin at center, y up). */
  pointer: readonly [number, number];
  brightness: number;
  colors: readonly [Rgb, Rgb, Rgb];
}

export interface Fluid {
  draw(frame: FluidFrame): void;
  resize(): void;
  /**
   * False when the device cannot run the shader smoothly (no GPU acceleration,
   * or frames stay slow at the lowest quality). The caller should then draw
   * only when something changes, not every frame.
   */
  readonly canAnimate: boolean;
}

const UNIFORMS = [
  "resolution",
  "pointer",
  "time",
  "brightness",
  "colorA",
  "colorB",
  "colorC",
] as const;
type UniformName = (typeof UNIFORMS)[number];

/**
 * Canvas pixels per CSS pixel. The field is soft, so it starts well below
 * native resolution and only sharpens on devices that have frame time to spare.
 */
const START_SCALE = 0.5;
const MIN_SCALE = 0.3;
const MAX_SCALE = 1.25;
/** Average frame times (ms) that raise or lower quality, or give up on animating. */
const FAST_FRAME_MS = 19;
const SLOW_FRAME_MS = 26;
const TOO_SLOW_FRAME_MS = 45;
const FRAMES_PER_MEASUREMENT = 20;

/**
 * Draws the background field into `canvas`. Returns null when WebGL is not
 * available; the page then keeps its CSS gradient.
 */
export function createFluid(canvas: HTMLCanvasElement): Fluid | null {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const program = linkProgram(gl);
  if (!program) return null;
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = Object.fromEntries(
    UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
  ) as Record<UniformName, WebGLUniformLocation | null>;

  const maxScale = Math.min(window.devicePixelRatio || 1, MAX_SCALE);
  let canAnimate = !isSoftwareRenderer(gl);
  let renderScale = canAnimate ? Math.min(START_SCALE, maxScale) : MIN_SCALE;
  let measuredFrames = 0;
  let measuredMs = 0;
  let lastDraw = 0;

  function resize() {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * renderScale));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * renderScale));
    gl?.viewport(0, 0, canvas.width, canvas.height);
  }

  function setScale(scale: number) {
    renderScale = Math.min(maxScale, Math.max(MIN_SCALE, scale));
    resize();
  }

  /** Every few frames, trade resolution for frame rate in whichever direction is needed. */
  function adaptQuality(now: number) {
    // A long gap means the tab was hidden or the loop paused, not that a frame was slow.
    if (lastDraw > 0 && now - lastDraw < 500) {
      measuredMs += now - lastDraw;
      measuredFrames += 1;
    }
    lastDraw = now;
    if (measuredFrames < FRAMES_PER_MEASUREMENT) return;

    const average = measuredMs / measuredFrames;
    measuredFrames = 0;
    measuredMs = 0;
    if (average > TOO_SLOW_FRAME_MS && renderScale <= MIN_SCALE) canAnimate = false;
    else if (average > SLOW_FRAME_MS) setScale(renderScale * 0.7);
    else if (average < FAST_FRAME_MS && renderScale < maxScale) setScale(renderScale * 1.25);
  }

  resize();

  return {
    resize,
    get canAnimate() {
      return canAnimate;
    },
    draw(frame) {
      if (gl.isContextLost()) return;
      if (canAnimate) adaptQuality(performance.now());
      gl.uniform2f(uniform.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniform.pointer, frame.pointer[0], frame.pointer[1]);
      gl.uniform1f(uniform.time, frame.time);
      gl.uniform1f(uniform.brightness, frame.brightness);
      gl.uniform3fv(uniform.colorA, frame.colors[0]);
      gl.uniform3fv(uniform.colorB, frame.colors[1]);
      gl.uniform3fv(uniform.colorC, frame.colors[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

/** True when WebGL is emulated on the CPU, where a full-screen shader would stall the page. */
function isSoftwareRenderer(gl: WebGLRenderingContext): boolean {
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  return /swiftshader|llvmpipe|software|basic render/i.test(renderer);
}

function linkProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX_SHADER],
    [gl.FRAGMENT_SHADER, FRAGMENT_SHADER],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("Shader failed to compile:", gl.getShaderInfoLog(shader));
      return null;
    }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}
