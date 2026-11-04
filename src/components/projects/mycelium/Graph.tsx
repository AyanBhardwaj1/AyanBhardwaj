"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { DOMAINS, PAGES, domainColor, type Page } from "./corpus";
import "./mycelium.css";

type N = Page & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  c: number;
};
type E = { a: number; b: number; w: number };

/** Normalised shared-term overlap, threshold 0.08, at most 5 per node. */
function affinity(): E[] {
  const sets = PAGES.map((p) => new Set(p.tags));
  const seen = new Map<string, E>();
  PAGES.forEach((_, i) => {
    PAGES.map((_, j) => {
      if (i === j) return { j, w: 0 };
      let shared = 0;
      sets[i].forEach((t) => sets[j].has(t) && shared++);
      return { j, w: shared / Math.sqrt(sets[i].size * sets[j].size) };
    })
      .filter((x) => x.w >= 0.08)
      .sort((x, y) => y.w - x.w)
      .slice(0, 5)
      .forEach(({ j, w }) => {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(k))
          seen.set(k, { a: Math.min(i, j), b: Math.max(i, j), w });
      });
  });
  return [...seen.values()];
}

function seed(): N[] {
  return PAGES.map((p, i) => {
    const c = DOMAINS.indexOf(p.domain);
    const t = (c / DOMAINS.length) * Math.PI * 2;
    return {
      ...p,
      c,
      r: 4 + Math.sqrt(p.revisits + p.matches) * 2,
      x: Math.cos(t) * 180 + ((i * 37) % 40) - 20,
      y: Math.sin(t) * 140 + ((i * 53) % 40) - 20,
      vx: 0,
      vy: 0,
    };
  });
}

/** One simulation step, loosely following Mycelium's d3-force settings. */
function step(nodes: N[], edges: E[], alpha: number) {
  for (const e of edges) {
    const A = nodes[e.a];
    const B = nodes[e.b];
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const d = Math.hypot(dx, dy) || 1;
    const target = 90 + (1 - e.w) * 130;
    const k = ((d - target) / d) * (0.035 + e.w * 0.08) * alpha;
    A.vx += dx * k;
    A.vy += dy * k;
    B.vx -= dx * k;
    B.vy -= dy * k;
  }
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const A = nodes[i];
      const B = nodes[j];
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const d2 = dx * dx + dy * dy || 1;
      if (d2 > 520 * 520) continue;
      const d = Math.sqrt(d2);
      const charge = (80 + A.r * 7) * alpha;
      const f = charge / d2;
      A.vx -= dx * f;
      A.vy -= dy * f;
      B.vx += dx * f;
      B.vy += dy * f;
      const min = A.r + B.r + 18;
      if (d < min) {
        const push = ((min - d) / d) * 0.5;
        A.x -= dx * push;
        A.y -= dy * push;
        B.x += dx * push;
        B.y += dy * push;
      }
    }
  for (const n of nodes) {
    const t = (n.c / DOMAINS.length) * Math.PI * 2;
    n.vx += (Math.cos(t) * 170 - n.x) * 0.05 * alpha * 0.2;
    n.vy += (Math.sin(t) * 120 - n.y) * 0.05 * alpha * 0.2;
    n.vx -= n.x * 0.012 * alpha;
    n.vy -= n.y * 0.012 * alpha;
    n.vx *= 0.6;
    n.vy *= 0.6;
    n.x += n.vx;
    n.y += n.vy;
    // Soft walls keep loners in view.
    n.x = Math.max(-300, Math.min(300, n.x));
    n.y = Math.max(-220, Math.min(220, n.y));
  }
}

const mq = () => window.matchMedia("(prefers-reduced-motion: reduce)");
const useReduced = () =>
  useSyncExternalStore(
    (cb) => {
      const m = mq();
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => mq().matches,
    () => false,
  );

export function Graph() {
  const edges = useMemo(() => affinity(), []);
  const nodes = useRef<N[]>(seed());
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const reduce = useReduced();
  const searchId = useId();
  const state = useRef({
    alpha: 1,
    grow: 0,
    sel,
    hover,
    query,
    drag: -1 as number,
    tf: { k: 1, cx: 0, cy: 0 },
  });

  const neighbours = useMemo(() => {
    const m = new Map<number, { i: number; w: number }[]>();
    for (const e of edges) {
      m.set(e.a, [...(m.get(e.a) ?? []), { i: e.b, w: e.w }]);
      m.set(e.b, [...(m.get(e.b) ?? []), { i: e.a, w: e.w }]);
    }
    m.forEach((v) => v.sort((x, y) => y.w - x.w));
    return m;
  }, [edges]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      PAGES.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)) ||
          p.domain.includes(q),
      ).map((p) => p.id),
    );
  }, [query]);
  const matchRef = useRef(matches);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const ns = nodes.current;
    const st = state.current;
    if (reduce) {
      for (let i = 0; i < 300; i++) step(ns, edges, 1 - i / 300);
      st.alpha = 0;
      st.grow = 1;
    }
    let raf = 0;
    let visible = true;
    let dirty = true;

    const view = () => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      // Fit the current layout's bounds (frozen while dragging).
      if (st.drag >= 0) return { w, h, ...st.tf };
      let x0 = Infinity,
        x1 = -Infinity,
        y0 = Infinity,
        y1 = -Infinity;
      for (const n of ns) {
        x0 = Math.min(x0, n.x - n.r);
        x1 = Math.max(x1, n.x + n.r);
        y0 = Math.min(y0, n.y - n.r);
        y1 = Math.max(y1, n.y + n.r);
      }
      const k = Math.min(w / (x1 - x0 + 120), h / (y1 - y0 + 90), 1.6);
      const tf = { k, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
      st.tf = tf;
      return { w, h, ...tf };
    };

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const { w, h, k, cx, cy } = view();
      if (c.width !== Math.round(w * dpr)) c.width = Math.round(w * dpr);
      if (c.height !== Math.round(h * dpr)) c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2);
      ctx.scale(k, k);
      ctx.translate(-cx, -cy);
      const focus = st.hover ?? st.sel;
      const near = new Set<number>();
      if (focus !== null) {
        near.add(focus);
        neighbours.get(focus)?.forEach((x) => near.add(x.i));
      }
      const m = matchRef.current;
      const lit = (i: number) =>
        (focus === null || near.has(i)) && (!m || m.has(i));
      // hyphae
      edges.forEach((e, idx) => {
        const A = ns[e.a];
        const B = ns[e.b];
        const g = Math.max(
          0,
          Math.min(1, st.grow * 1.6 - (idx / edges.length) * 0.6),
        );
        if (g <= 0) return;
        const on = lit(e.a) && lit(e.b);
        const mx = (A.x + B.x) / 2 + (B.y - A.y) * 0.12;
        const my = (A.y + B.y) / 2 - (B.x - A.x) * 0.12;
        ctx.strokeStyle = on
          ? `rgba(198,168,255,${0.18 + e.w * 0.5})`
          : "rgba(198,168,255,0.04)";
        ctx.lineWidth = on && focus !== null ? 1.4 : 0.8;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        if (g >= 1) ctx.quadraticCurveTo(mx, my, B.x, B.y);
        else {
          // partial quadratic: de Casteljau split at g
          const x1 = A.x + (mx - A.x) * g;
          const y1 = A.y + (my - A.y) * g;
          const x2 = mx + (B.x - mx) * g;
          const y2 = my + (B.y - my) * g;
          ctx.quadraticCurveTo(x1, y1, x1 + (x2 - x1) * g, y1 + (y2 - y1) * g);
        }
        ctx.stroke();
      });
      // spores
      ns.forEach((n, i) => {
        const on = lit(i);
        const col = domainColor(n.domain);
        ctx.globalAlpha = on ? 1 : 0.18;
        ctx.shadowColor = col;
        ctx.shadowBlur = on ? (i === focus ? 22 : 10) : 0;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + (i === focus ? 2 : 0), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (i === st.sel) {
          ctx.strokeStyle = "#f2edf8";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        if (on && (focus !== null || m) && (near.has(i) || m?.has(i))) {
          ctx.fillStyle = "#f2edf8";
          ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.textAlign = "center";
          const label =
            n.title.length > 34 ? `${n.title.slice(0, 32)}…` : n.title;
          ctx.fillText(label, n.x, n.y - n.r - 7);
        }
      });
      ctx.globalAlpha = 1;
    };

    let last = 0;
    const loop = (now: number) => {
      raf = 0;
      // Time-based growth so throttled frames don't stall the hyphae.
      const dt = last ? Math.min(200, now - last) : 16;
      last = now;
      if (!visible) {
        last = 0;
        return;
      }
      if (st.alpha > 0.02) {
        step(ns, edges, st.alpha);
        st.alpha *= Math.pow(0.985, dt / 16);
        dirty = true;
      }
      if (st.grow < 1) {
        st.grow = Math.min(1, st.grow + dt / 1600);
        dirty = true;
      }
      if (dirty) draw();
      dirty = false;
      if (st.alpha > 0.02 || st.grow < 1) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      dirty = true;
      if (reduce) return draw();
      if (!raf) raf = requestAnimationFrame(loop);
    };
    (st as unknown as { kick: () => void }).kick = kick;

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(c);
    const ro = new ResizeObserver(kick);
    ro.observe(c);
    kick();
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [edges, neighbours, reduce]);

  // Sync interaction state into the draw loop, then redraw.
  useEffect(() => {
    const st = state.current;
    st.sel = sel;
    st.hover = hover;
    st.query = query;
    matchRef.current = matches;
    (st as unknown as { kick?: () => void }).kick?.();
  }, [sel, hover, query, matches]);

  const pick = (clientX: number, clientY: number) => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    const { k, cx, cy } = state.current.tf;
    const x = (clientX - r.left - c.clientWidth / 2) / k + cx;
    const y = (clientY - r.top - c.clientHeight / 2) / k + cy;
    let best = -1;
    let bd = Infinity;
    nodes.current.forEach((n, i) => {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < n.r + 8 && d < bd) {
        bd = d;
        best = i;
      }
    });
    return { best, x, y };
  };

  const page = sel === null ? null : PAGES[sel];
  const rel = sel === null ? [] : (neighbours.get(sel) ?? []);

  return (
    <div className="myc-graph" ref={wrap}>
      <div className="myc-graphTop">
        <label htmlFor={searchId} className="myc-label">
          Graph search
        </label>
        <input
          id={searchId}
          className="myc-graphSearch"
          value={query}
          placeholder="agents, privacy, wasm…"
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          maxLength={40}
        />
        <span className="myc-graphCount" aria-live="polite">
          {matches
            ? `${matches.size} of ${PAGES.length} visible`
            : `${PAGES.length} pages · ${edges.length} hyphae`}
        </span>
      </div>
      <div className="myc-graphStage">
        <canvas
          ref={canvas}
          className="myc-canvas"
          aria-hidden="true"
          onPointerMove={(e) => {
            const st = state.current;
            if (st.drag >= 0) {
              const { x, y } = pick(e.clientX, e.clientY);
              const n = nodes.current[st.drag];
              n.x = x;
              n.y = y;
              n.vx = n.vy = 0;
              st.alpha = Math.max(st.alpha, reduce ? 0 : 0.15);
              (st as unknown as { kick: () => void }).kick();
              return;
            }
            const { best } = pick(e.clientX, e.clientY);
            setHover(best >= 0 ? best : null);
            e.currentTarget.style.cursor = best >= 0 ? "pointer" : "default";
          }}
          onPointerLeave={() => setHover(null)}
          onPointerDown={(e) => {
            const { best } = pick(e.clientX, e.clientY);
            if (best >= 0) {
              e.currentTarget.setPointerCapture(e.pointerId);
              state.current.drag = best;
              setSel(best);
            }
          }}
          onPointerUp={() => {
            state.current.drag = -1;
          }}
        />
        <aside
          className="myc-inspector"
          data-open={page ? "" : undefined}
          aria-label="Page inspector"
        >
          {page ? (
            <>
              <button
                type="button"
                className="myc-close"
                onClick={() => setSel(null)}
                aria-label="Close inspector"
              >
                ×
              </button>
              <p
                className="myc-label"
                style={{ color: domainColor(page.domain) }}
              >
                {page.domain}
              </p>
              <h4>{page.title}</h4>
              <p className="myc-insExcerpt">{page.excerpt}</p>
              <dl>
                <div>
                  <dt>Words</dt>
                  <dd>{page.words.toLocaleString("en-US")}</dd>
                </div>
                <div>
                  <dt>Revisits</dt>
                  <dd>{page.revisits}</dd>
                </div>
                <div>
                  <dt>Search hits</dt>
                  <dd>{page.matches}</dd>
                </div>
              </dl>
              <p className="myc-label">Related pages</p>
              <ul>
                {rel.map(({ i, w }) => (
                  <li key={i}>
                    <button type="button" onClick={() => setSel(i)}>
                      {PAGES[i].title}
                    </button>
                    <b>{w.toFixed(2)}</b>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="myc-insEmpty">
              Hover a spore to see its hyphae. Click one, or pick a page from
              the list, to inspect it.
            </p>
          )}
        </aside>
      </div>
      <details className="myc-allPages">
        <summary>All {PAGES.length} pages, as a list</summary>
        <ul>
          {PAGES.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={sel === p.id}
                onClick={() => setSel(p.id)}
              >
                <i
                  style={{ background: domainColor(p.domain) }}
                  aria-hidden="true"
                />
                {p.title}
                <small>
                  {p.domain} · {(neighbours.get(p.id) ?? []).length} links
                </small>
              </button>
            </li>
          ))}
        </ul>
      </details>
      <ul className="myc-legend" aria-label="Domain colours">
        {DOMAINS.map((d) => (
          <li key={d}>
            <i style={{ background: domainColor(d) }} aria-hidden="true" />
            {d}
          </li>
        ))}
      </ul>
    </div>
  );
}
