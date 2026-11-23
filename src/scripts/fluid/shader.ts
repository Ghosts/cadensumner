/** One triangle that covers the screen. */
export const VERTEX_SHADER = /* glsl */ `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

/**
 * Domain-warped noise: sample fractal noise, use the result to offset the next
 * sample, and repeat. The fine lines come from taking bands of the final value.
 */
export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform float brightness;
uniform float warp;
uniform vec3 colorA;
uniform vec3 colorB;
uniform vec3 colorC;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + 1.0), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 5; octave++) {
    sum += amplitude * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return sum;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;

  // Bend the field around the pointer.
  vec2 toPointer = uv - pointer;
  uv += toPointer * 0.35 * exp(-dot(toPointer, toPointer) * 5.0);

  vec2 q = vec2(fbm(uv * 1.3 + time * 0.06), fbm(uv * 1.3 + vec2(5.2, 1.3) - time * 0.05));
  vec2 w = vec2(fbm(uv * 1.1 + 3.0 * q + time * 0.04), fbm(uv * 1.1 + 3.0 * q + vec2(8.3, 2.8)));
  float field = fbm(uv + warp * w);

  float band = abs(fract(field * 11.0 + time * 0.08) - 0.5) * 2.0;
  vec3 color = mix(colorA, colorB, smoothstep(0.25, 0.75, field));
  color = mix(color, colorC, smoothstep(0.45, 1.05, length(w)) * 0.7);
  color *= 0.7 + 0.3 * smoothstep(0.0, 0.2, band);
  color += smoothstep(0.9, 1.0, band) * 0.16;

  gl_FragColor = vec4(color * brightness, 1.0);
}`;
