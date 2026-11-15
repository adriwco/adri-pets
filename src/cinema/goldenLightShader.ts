export const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_sun_position;
uniform vec3 u_sun_color;
uniform vec3 u_warm_color;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 4; octave++) {
    value += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

float dustMotes(vec2 p, float t) {
  float motes = 0.0;
  for (int layer = 0; layer < 3; layer++) {
    float depth = float(layer);
    vec2 grid = p * (5.0 + depth * 4.0) + vec2(t * 0.12 * (1.0 + depth), -t * 0.2);
    vec2 cell = floor(grid);
    vec2 local = fract(grid) - 0.5;
    float seed = hash(cell + depth * 17.0);
    vec2 offset = vec2(hash(cell + 1.7), hash(cell + 4.3)) - 0.5;
    float radius = 0.035 + 0.05 * seed;
    float twinkle = 0.55 + 0.45 * sin(t * 1.6 + seed * 6.2831);
    motes += step(0.8, seed) * smoothstep(radius, 0.0, length(local - offset * 0.6)) * twinkle * (0.7 - depth * 0.18);
  }
  return motes;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  float t = u_time;

  float distanceToSun = distance(uv * aspect, u_sun_position * aspect);
  float glow = exp(-distanceToSun * 2.6);
  float haze = fbm(uv * aspect * 2.2 + vec2(t * 0.03, t * 0.018));
  vec2 direction = uv - u_sun_position;
  float angle = atan(direction.y, direction.x);
  float rays = pow(0.5 + 0.5 * sin(angle * 9.0 + t * 0.12 + haze * 2.4), 3.0) * exp(-distanceToSun * 1.5);
  float dust = dustMotes(uv * aspect, t) * smoothstep(1.3, 0.15, distanceToSun);

  vec3 light = mix(u_warm_color, u_sun_color, clamp(glow * 1.5, 0.0, 1.0));
  vec3 dustColor = mix(u_sun_color, vec3(1.0), 0.55);
  float lightAlpha = clamp(glow * 0.5 + rays * 0.2 + haze * glow * 0.3, 0.0, 1.0);
  float dustAlpha = clamp(dust, 0.0, 1.0);
  float edgeFade = smoothstep(0.0, 0.28, uv.x) * smoothstep(1.0, 0.72, uv.x) * smoothstep(0.0, 0.28, uv.y) * smoothstep(1.0, 0.72, uv.y);
  float alpha = clamp(lightAlpha + dustAlpha * (1.0 - lightAlpha), 0.0, 1.0) * edgeFade;
  vec3 color = (light * lightAlpha + dustColor * dustAlpha * (1.0 - lightAlpha)) * edgeFade;
  gl_FragColor = vec4(color, alpha);
}
`;
