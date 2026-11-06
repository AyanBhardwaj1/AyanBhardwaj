/**
 * "After-hours field": a full-bleed WebGL1 fragment shader behind the hero.
 * Slow domain-warped contour ribbons in the accent color over a faint
 * terminal grid, bending gently toward the cursor.
 *
 * Budget: DPR <= 1.5 (1 on touch screens), <= 45 fps, paused off-screen and
 * in hidden tabs. Any failure (no WebGL, software-only GL, lost context)
 * returns or tears down quietly and the CSS gradient underneath stays.
 * Loaded on idle by HeroField, never part of the first paint.
 */

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
#extension GL_OES_standard_derivatives : enable
precision mediump float;
uniform vec2 u_res;     // drawing buffer px
uniform float u_scale;  // buffer px per CSS px
uniform float u_t;      // seconds
uniform vec2 u_m;       // pointer, 0..1 (y up)
uniform float u_pull;   // 0..1 pointer influence
uniform vec3 u_col;     // accent, linear-ish 0..1
uniform float u_gain;   // overall intensity (theme)

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return v;
}
float aa(float d, float w) {
  #ifdef GL_OES_standard_derivatives
    return 1.0 - smoothstep(0.0, w * fwidth(d) + 1e-4, abs(fract(d - 0.5) - 0.5));
  #else
    return 1.0 - smoothstep(0.0, 0.04 * w, abs(fract(d - 0.5) - 0.5));
  #endif
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float aspect = u_res.x / u_res.y;
  vec2 uv = frag / u_res;
  vec2 p = vec2(uv.x * aspect, uv.y) * 2.2;

  // Pointer: pull the field toward the cursor (a soft gravity well).
  vec2 m = vec2(u_m.x * aspect, u_m.y) * 2.2;
  vec2 dm = p - m;
  float well = exp(-dot(dm, dm) * 1.6) * u_pull;
  p -= dm * well * 0.55;

  float t = u_t * 0.045;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 1.7 * q + vec2(1.7, 9.2) + t * 0.6),
                fbm(p + 1.7 * q + vec2(8.3, 2.8) - t * 0.4));
  float v = fbm(p + 1.9 * r);

  // Contour ribbons: thin lines, every 4th one a touch brighter.
  float c = v * 14.0;
  float minor = aa(c, 1.1);
  float major = aa(c * 0.25, 1.4);
  float ribbons = minor * 0.55 + major * 0.75;
  ribbons *= 0.55 + 0.9 * smoothstep(0.25, 0.85, length(r));
  ribbons *= 1.0 + well * 0.8;

  // Terminal grid (48 CSS px) with brighter crossings; drifts very slowly.
  vec2 g = (frag / u_scale + vec2(u_t * 2.0, 0.0)) / 48.0;
  vec2 gd = abs(fract(g) - 0.5);
  float gl = 1.0 - smoothstep(0.0, 1.0 / 48.0, min(0.5 - gd.x, 0.5 - gd.y));
  vec2 gx = 1.0 - smoothstep(vec2(0.0), vec2(3.0 / 48.0), 0.5 - gd);
  float cross = gx.x * gx.y;
  // Ticker texture: faint scanlines every 3 CSS px.
  float scan = step(0.5, fract(frag.y / u_scale / 3.0)) * 0.025;

  float a = ribbons * 0.32 + gl * 0.05 + cross * 0.16 + scan;
  a = clamp(a * u_gain, 0.0, 1.0);
  gl_FragColor = vec4(u_col * a, a);
}
`;

type Opts = { onFail: () => void };

const parseColor = (s: string): [number, number, number] | null => {
  const v = s.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const rgb = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(v);
  if (rgb) return [+rgb[1] / 255, +rgb[2] / 255, +rgb[3] / 255];
  return null;
};

const luminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Mounts the canvas into `host`; returns a cleanup. */
export function startField(host: HTMLElement, { onFail }: Opts): () => void {
  const canvas = document.createElement("canvas");
  canvas.className = "hx-field-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
    // Software-only GL would burn the CPU: keep the CSS fallback instead.
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) {
    onFail();
    return () => {};
  }
  // Some software rasterizers slip past the caveat flag: skip those too.
  // (localStorage "fx:gl" = "force" overrides, for testing in headless.)
  let force = false;
  try {
    force = localStorage.getItem("fx:gl") === "force";
  } catch {
    /* storage blocked */
  }
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info
    ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
    : "";
  if (!force && /swiftshader|llvmpipe|softpipe|software/i.test(renderer)) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    onFail();
    return () => {};
  }
  gl.getExtension("OES_standard_derivatives");

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    onFail();
    return () => {};
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = U("u_res"),
    uScale = U("u_scale"),
    uT = U("u_t"),
    uM = U("u_m"),
    uPull = U("u_pull"),
    uCol = U("u_col"),
    uGain = U("u_gain");

  host.appendChild(canvas);

  // --- theme: read the accent and background from CSS variables ---------
  const readTheme = () => {
    const cs = getComputedStyle(host);
    const col = parseColor(cs.getPropertyValue("--accent")) ?? [1, 0.64, 0.1];
    const bg = parseColor(cs.getPropertyValue("--bg")) ?? [0.04, 0.04, 0.04];
    const light = luminance(bg) > 0.5;
    gl.uniform3f(uCol, col[0], col[1], col[2]);
    // Pre-market: barely there. After hours: still quiet.
    gl.uniform1f(uGain, light ? 0.42 : 0.75);
  };

  // --- size -------------------------------------------------------------
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  let scale = 1;
  const resize = () => {
    scale = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5);
    const w = Math.max(1, Math.round(host.clientWidth * scale));
    const h = Math.max(1, Math.round(host.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uScale, scale);
  };

  // --- pointer (lerped) ---------------------------------------------------
  const target = { x: 0.5, y: 0.6, pull: 0 };
  const cur = { x: 0.5, y: 0.6, pull: 0 };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const r = host.getBoundingClientRect();
    target.x = (e.clientX - r.left) / r.width;
    target.y = 1 - (e.clientY - r.top) / r.height;
    target.pull = target.y < -0.1 || target.y > 1.1 ? 0 : 1;
  };
  const onLeave = () => (target.pull = 0);

  // --- loop: <= 45 fps, only while visible --------------------------------
  let raf = 0;
  let last = 0;
  let clock = Math.random() * 400;
  let visible = true;
  let shown = false;
  let lost = false;
  const FRAME = 1000 / 45;
  let probing = true;
  let probeStart = 0;
  let probeFrames = 0;
  const resetProbe = () => {
    probeStart = 0;
    probeFrames = 0;
  };
  const fail = () => {
    lost = true;
    stop();
    canvas.removeAttribute("data-on");
    onFail();
  };

  const frame = (now: number) => {
    raf = 0;
    if (lost) return;
    const dt = now - last;
    if (dt >= FRAME - 1) {
      clock += Math.min(dt, 100) / 1000;
      last = now;
      const k = 1 - Math.pow(0.001, Math.min(dt, 100) / 1000); // ~frame-rate independent lerp
      cur.x += (target.x - cur.x) * k;
      cur.y += (target.y - cur.y) * k;
      cur.pull += (target.pull - cur.pull) * k * 0.6;
      gl.uniform1f(uT, clock);
      gl.uniform2f(uM, cur.x, cur.y);
      gl.uniform1f(uPull, cur.pull);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // Watchdog: if the GPU can't hold ~15 fps over the first 2.5 s of
      // visible time, bow out to the static gradient.
      if (probing && !force) {
        if (!probeStart) probeStart = now;
        probeFrames++;
        const span = now - probeStart;
        if (span > 2500) {
          probing = false;
          if ((probeFrames * 1000) / span < 15) return fail();
        }
      }
      if (!shown) {
        shown = true;
        // Fade in after the first real frame lands.
        requestAnimationFrame(() => canvas.setAttribute("data-on", ""));
      }
    }
    schedule();
  };
  const schedule = () => {
    if (!raf && visible && !document.hidden && !lost)
      raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) {
      last = performance.now();
      resetProbe();
      schedule();
    } else stop();
  });
  io.observe(host);
  const onVis = () => {
    if (document.hidden) stop();
    else {
      last = performance.now();
      resetProbe();
      schedule();
    }
  };
  const ro = new ResizeObserver(() => resize());
  ro.observe(host);
  const mo = new MutationObserver(readTheme);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "class"],
  });
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const onScheme = () => readTheme();
  const onLost = (e: Event) => {
    e.preventDefault();
    fail();
  };

  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  scheme.addEventListener("change", onScheme);
  canvas.addEventListener("webglcontextlost", onLost);

  readTheme();
  resize();
  schedule();

  return () => {
    stop();
    io.disconnect();
    ro.disconnect();
    mo.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerleave", onLeave);
    scheme.removeEventListener("change", onScheme);
    canvas.removeEventListener("webglcontextlost", onLost);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  };
}
