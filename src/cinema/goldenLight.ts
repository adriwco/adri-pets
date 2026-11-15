import { FRAGMENT_SHADER, VERTEX_SHADER } from "./goldenLightShader";
import { parseCssColor, type RgbUnit } from "./parseCssColor";

const RENDER_SCALE = 0.6;
const FRAME_INTERVAL_MS = 1000 / 30;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function themeColor(name: string, fallback: string): RgbUnit {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return parseCssColor(value) ?? parseCssColor(getComputedStyle(document.documentElement).getPropertyValue(fallback)) ?? [1, 1, 1];
}

export function mountGoldenLight(host: HTMLElement, sun: HTMLElement | null): () => void {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
  if (!gl) return () => undefined;

  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return () => undefined;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return () => undefined;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const resolution = gl.getUniformLocation(program, "u_resolution");
  const time = gl.getUniformLocation(program, "u_time");
  const sunPosition = gl.getUniformLocation(program, "u_sun_position");
  gl.uniform3fv(gl.getUniformLocation(program, "u_sun_color"), themeColor("--color-sun", "--brand-secondary"));
  gl.uniform3fv(gl.getUniformLocation(program, "u_warm_color"), themeColor("--brand-secondary", "--color-sun"));

  host.appendChild(canvas);

  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * RENDER_SCALE;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolution, canvas.width, canvas.height);
  };

  const updateSunPosition = () => {
    const canvasRect = canvas.getBoundingClientRect();
    const sunRect = sun?.getBoundingClientRect();
    if (!sunRect || canvasRect.width === 0 || canvasRect.height === 0) {
      gl.uniform2f(sunPosition, 0.8, 0.85);
      return;
    }
    const x = (sunRect.left + sunRect.width / 2 - canvasRect.left) / canvasRect.width;
    const y = 1 - (sunRect.top + sunRect.height / 2 - canvasRect.top) / canvasRect.height;
    gl.uniform2f(sunPosition, x, y);
  };

  let visible = true;
  let frameId = 0;
  let lastFrame = 0;
  const startedAt = performance.now();

  const loop = (now: number) => {
    frameId = requestAnimationFrame(loop);
    if (!visible || document.hidden || now - lastFrame < FRAME_INTERVAL_MS) return;
    lastFrame = now;
    updateSunPosition();
    gl.uniform1f(time, (now - startedAt) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
  });
  visibilityObserver.observe(canvas);
  resize();
  frameId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    canvas.remove();
  };
}
