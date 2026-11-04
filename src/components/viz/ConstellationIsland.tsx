"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ConstellationData, StarNode } from "@/lib/constellation";
import type { Body, Sim } from "./graph-physics";
import "../sections/lower/graph.css";

/**
 * EQS <GO>: project constellation. Layout arrives precomputed from the server.
 * Map view (SVG, decorative for AT) and List view (semantic). The list is the
 * default below 768px. Roving focus with arrow keys on the map; Enter opens the
 * detail panel.
 *
 * Physics: once the map is in view (and motion is allowed), a small force
 * simulation is loaded on demand. Stars can be dragged and spring back, drift
 * slowly, and shy away from the cursor. A click (not a drag) opens the
 * project's page. Under reduced motion the map stays static.
 */

const mq = "(min-width: 768px)";

/** A gently bowed edge: quadratic curve with its control point off the midpoint. */
const curve = (ax: number, ay: number, bx: number, by: number) => {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const k = 0.12;
  const cx = mx - (by - ay) * k;
  const cy = my + (bx - ax) * k;
  return `M${ax.toFixed(1)} ${ay.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
};
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(mq);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export function ConstellationIsland({ data }: { data: ConstellationData }) {
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(mq).matches,
    () => true,
  );
  const [choice, setChoice] = useState<"map" | "list" | null>(null);
  const view = choice ?? (wide ? "map" : "list");
  const [filter, setFilter] = useState<string | null>(null);
  const [predict, setPredict] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // First time the map is on screen: stars and links draw in once.
  const [entered, setEntered] = useState(false);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!entered) return;
    const t = window.setTimeout(() => setSettled(true), 2400);
    return () => window.clearTimeout(t);
  }, [entered]);
  const [focusId, setFocusId] = useState<string>(data.nodes[0]?.id ?? "");
  const nodeRefs = useRef(new Map<string, SVGGElement>());
  const edgeRefs = useRef(new Map<string, SVGPathElement>());
  const predRefs = useRef(new Map<string, SVGGElement>());
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<Sim | null>(null);
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean }>(
    null,
  );
  const suppressClick = useRef(false);
  const router = useRouter();

  const byId = useMemo(
    () => new Map(data.nodes.map((n) => [n.id, n])),
    [data.nodes],
  );
  const neighbors = useMemo(() => {
    const m = new Map<string, Set<string>>(
      data.nodes.map((n) => [n.id, new Set()]),
    );
    for (const e of data.edges) {
      m.get(e.source)!.add(e.target);
      m.get(e.target)!.add(e.source);
    }
    return m;
  }, [data]);

  // Load the simulation when the map first scrolls into view.
  useEffect(() => {
    if (view !== "map") return;
    const svg = svgRef.current;
    if (!svg) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- static map: show it at once
      setEntered(true);
      return;
    }
    let cancelled = false;
    let visible = false;
    const draw = (b: Map<string, Body>) => {
      for (const [id, body] of b) {
        nodeRefs.current
          .get(id)
          ?.setAttribute(
            "transform",
            `translate(${body.x.toFixed(1)} ${body.y.toFixed(1)})`,
          );
      }
      for (const [k, el] of edgeRefs.current) {
        const [s0, t0] = k.split("|");
        const a = b.get(s0);
        const c = b.get(t0);
        if (!a || !c) continue;
        el.setAttribute("d", curve(a.x, a.y, c.x, c.y));
      }
      for (const [k, el] of predRefs.current) {
        const [s0, t0] = k.split("|");
        const a = b.get(s0);
        const c = b.get(t0);
        if (!a || !c) continue;
        const line = el.firstElementChild;
        line?.setAttribute("x1", a.x.toFixed(1));
        line?.setAttribute("y1", a.y.toFixed(1));
        line?.setAttribute("x2", c.x.toFixed(1));
        line?.setAttribute("y2", c.y.toFixed(1));
        const label = el.lastElementChild;
        label?.setAttribute("x", ((a.x + c.x) / 2).toFixed(1));
        label?.setAttribute("y", ((a.y + c.y) / 2 - 4).toFixed(1));
      }
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (simRef.current) {
          simRef.current.setActive(visible);
          return;
        }
        if (!visible) return;
        import("./graph-physics").then(({ createSim }) => {
          if (cancelled) return;
          simRef.current = createSim({
            nodes: data.nodes,
            edges: data.edges,
            onFrame: draw,
          });
          simRef.current.setActive(visible);
        });
      },
      { rootMargin: "120px" },
    );
    io.observe(svg);
    // The draw-in waits until the map is properly on screen.
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setEntered(true);
        seen.disconnect();
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    seen.observe(svg);
    return () => {
      cancelled = true;
      seen.disconnect();
      io.disconnect();
      simRef.current?.stop();
      simRef.current = null;
    };
  }, [view, data]);

  const toSvg = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  function activate(n: StarNode) {
    if (n.page) router.push(n.page);
    else setSelected(selected === n.id ? null : n.id);
  }

  const lit = hover ?? selected;
  const isDim = (n: StarNode) => {
    if (filter && !n.clusters.includes(filter as StarNode["cluster"]))
      return true;
    if (lit && lit !== n.id && !neighbors.get(lit)?.has(n.id)) return true;
    return false;
  };
  // The panel keeps the last star you looked at, so its links stay reachable.
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const shownId = selected ?? lit ?? lastSeen;
  const shown = shownId ? byId.get(shownId) : undefined;

  function moveFocus(dir: "left" | "right" | "up" | "down") {
    const cur = byId.get(focusId);
    if (!cur) return;
    const angle = {
      right: 0,
      down: Math.PI / 2,
      left: Math.PI,
      up: -Math.PI / 2,
    }[dir];
    let best: StarNode | undefined;
    let bestD = Infinity;
    for (const n of data.nodes) {
      if (n.id === cur.id) continue;
      const dx = n.x - cur.x;
      const dy = n.y - cur.y;
      let diff = Math.atan2(dy, dx) - angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) > Math.PI / 4) continue;
      const d = Math.hypot(dx, dy);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    if (best) {
      setFocusId(best.id);
      nodeRefs.current.get(best.id)?.focus();
    }
  }

  const clusterChips = data.clusters.map((c) => (
    <button
      key={c.id}
      type="button"
      aria-pressed={filter === c.id}
      onClick={() => setFilter(filter === c.id ? null : c.id)}
      className={`chip min-h-9 transition-colors ${filter === c.id ? "border-accent text-accent" : "hover:text-fg"}`}
    >
      {c.label} <span className="text-muted">{c.count}</span>
    </button>
  ));

  return (
    <div className="card overflow-hidden">
      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <div className="t-data flex items-center gap-3">
          <span className="text-accent">EQS</span>
          <span className="text-muted">
            Project screener · {data.nodes.length} securities
          </span>
        </div>
        <div
          role="tablist"
          aria-label="Constellation view"
          className="t-label border-line-strong inline-flex rounded-full border p-0.5"
        >
          {(["map", "list"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              aria-controls={view === v ? `eqs-${v}` : undefined}
              tabIndex={view === v ? 0 : -1}
              data-tab={v}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const next = view === "map" ? "list" : "map";
                  setChoice(next);
                  e.currentTarget.parentElement
                    ?.querySelector<HTMLElement>(`[data-tab="${next}"]`)
                    ?.focus();
                }
              }}
              onClick={() => setChoice(v)}
              className={`min-h-8 rounded-full px-3 ${view === v ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="border-line flex flex-wrap items-center gap-2 border-b px-4 py-3 md:px-6">
        {clusterChips}
        {view === "map" && (
          <label className="t-label text-muted ml-auto inline-flex min-h-9 cursor-pointer items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={predict}
              onClick={() => setPredict((p) => !p)}
              className={`relative h-5 w-9 rounded-full border transition-colors ${predict ? "border-accent bg-accent/20" : "border-line-strong"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-3.5 rounded-full transition-transform ${predict ? "bg-accent translate-x-4" : "bg-muted"}`}
              />
              <span className="sr-only">Predict links</span>
            </button>
            <span aria-hidden="true">Predict links</span>
          </label>
        )}
      </div>

      {view === "map" ? (
        <div
          id="eqs-map"
          role="tabpanel"
          aria-label="Map"
          className="grid md:grid-cols-[1fr_300px]"
        >
          <div className="relative overflow-x-auto">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${data.width} ${data.height}`}
              className={`lw-graph h-auto w-full min-w-[640px] select-none ${entered ? "is-in" : ""} ${settled ? "is-settled" : ""} ${lit ? "is-lit" : ""}`}
              role="group"
              aria-label="Project constellation map. Use arrow keys to move between projects, Enter to open one, Space to pin its details."
              onPointerMove={(e) => {
                const p = toSvg(e);
                if (!p) return;
                simRef.current?.pointer(p.x, p.y);
                const d = drag.current;
                if (d) {
                  if (Math.hypot(p.x - d.x, p.y - d.y) > 4) d.moved = true;
                  simRef.current?.drag(p.x, p.y);
                }
              }}
              onPointerUp={() => {
                const d = drag.current;
                drag.current = null;
                if (d)
                  nodeRefs.current
                    .get(d.id)
                    ?.firstElementChild?.classList.remove("is-held");
                simRef.current?.release();
                if (!d) return;
                if (d.moved) {
                  suppressClick.current = true;
                  return;
                }
                // The svg holds pointer capture during a press, so the click
                // event lands on the svg, not the node: activate a tap here.
                const node = byId.get(d.id);
                if (node) activate(node);
              }}
              onPointerCancel={() => {
                const d = drag.current;
                if (d)
                  nodeRefs.current
                    .get(d.id)
                    ?.firstElementChild?.classList.remove("is-held");
                drag.current = null;
                simRef.current?.release();
              }}
              onPointerLeave={() => {
                setHover(null);
                simRef.current?.pointerOut();
              }}
            >
              {data.clusters.map((c) => (
                <text
                  key={c.id}
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  aria-hidden="true"
                  className="fill-[var(--fg-muted)] font-mono text-[11px] tracking-[0.12em] uppercase"
                >
                  {c.label}
                </text>
              ))}
              <g aria-hidden="true">
                {data.edges.map((e, i) => {
                  const a = byId.get(e.source)!;
                  const b = byId.get(e.target)!;
                  const on = !!lit && (e.source === lit || e.target === lit);
                  return (
                    <path
                      key={`${e.source}-${e.target}`}
                      ref={(el) => {
                        const k = `${e.source}|${e.target}`;
                        if (el) edgeRefs.current.set(k, el);
                        else edgeRefs.current.delete(k);
                      }}
                      d={curve(a.x, a.y, b.x, b.y)}
                      fill="none"
                      pathLength={e.kind === "same-cluster" ? undefined : 1}
                      className={`lw-edge-line ${e.kind === "same-cluster" ? "lw-edge-cluster" : ""} ${on ? "is-on" : ""}`}
                      style={
                        { "--d": `${200 + i * 14}ms` } as React.CSSProperties
                      }
                    />
                  );
                })}
                {predict &&
                  data.predicted.map((e) => {
                    const a = byId.get(e.source)!;
                    const b = byId.get(e.target)!;
                    return (
                      <g
                        key={`p-${e.source}-${e.target}`}
                        ref={(el) => {
                          const k = `${e.source}|${e.target}`;
                          if (el) predRefs.current.set(k, el);
                          else predRefs.current.delete(k);
                        }}
                      >
                        <line
                          x1={a.x}
                          y1={a.y}
                          x2={b.x}
                          y2={b.y}
                          stroke="var(--accent)"
                          strokeDasharray="4 4"
                          strokeOpacity="0.85"
                        />
                        <text
                          x={(a.x + b.x) / 2}
                          y={(a.y + b.y) / 2 - 4}
                          textAnchor="middle"
                          className="fill-[var(--accent)] font-mono text-[10px]"
                        >
                          {e.weight.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
              </g>
              {data.nodes.map((n, i) => {
                const dim = isDim(n);
                const active = lit === n.id;
                const near =
                  !!lit && !active && !!neighbors.get(lit)?.has(n.id);
                return (
                  <g
                    key={n.id}
                    ref={(el) => {
                      if (el) nodeRefs.current.set(n.id, el);
                      else nodeRefs.current.delete(n.id);
                    }}
                    transform={`translate(${n.x} ${n.y})`}
                    tabIndex={focusId === n.id ? 0 : -1}
                    role={n.page ? "link" : "button"}
                    aria-label={`${n.name}: ${n.tagline.replace(/\.$/, "")}${n.page ? ". Opens project page" : ""}`}
                    aria-pressed={n.page ? undefined : selected === n.id}
                    onPointerDown={(e) => {
                      const p = toSvg(e);
                      if (!p || e.button !== 0) return;
                      drag.current = { id: n.id, ...p, moved: false };
                      nodeRefs.current
                        .get(n.id)
                        ?.firstElementChild?.classList.add("is-held");
                      simRef.current?.grab(n.id, p.x, p.y);
                      svgRef.current?.setPointerCapture(e.pointerId);
                    }}
                    onPointerLeave={() => simRef.current?.hover(null)}
                    onPointerEnter={() => {
                      simRef.current?.hover(n.id);
                      setHover(n.id);
                      setLastSeen(n.id);
                    }}
                    onFocus={() => {
                      setFocusId(n.id);
                      setHover(n.id);
                      setLastSeen(n.id);
                    }}
                    onBlur={() => setHover(null)}
                    onClick={(e) => {
                      // Pointer taps are handled in the svg's onPointerUp;
                      // only keyboard/assistive clicks (detail 0) land here.
                      if (suppressClick.current) {
                        suppressClick.current = false;
                        return;
                      }
                      if (e.detail === 0) activate(n);
                    }}
                    onKeyDown={(e) => {
                      const k = {
                        ArrowLeft: "left",
                        ArrowRight: "right",
                        ArrowUp: "up",
                        ArrowDown: "down",
                      }[e.key] as "left" | "right" | "up" | "down" | undefined;
                      if (k) {
                        e.preventDefault();
                        moveFocus(k);
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        activate(n);
                      } else if (e.key === " ") {
                        e.preventDefault();
                        setSelected(selected === n.id ? null : n.id);
                      } else if (e.key === "Escape") {
                        setSelected(null);
                      }
                    }}
                    className="cursor-grab outline-none active:cursor-grabbing [&:focus-visible_.star-ring]:opacity-100"
                    style={{
                      opacity: dim ? 0.2 : 1,
                      transition:
                        "opacity 240ms cubic-bezier(0.23, 1, 0.32, 1)",
                      touchAction: "none",
                    }}
                  >
                    <g
                      className={`lw-star ${active ? "is-active" : ""} ${near ? "is-near" : ""}`}
                      style={
                        {
                          "--d": `${Math.round(Math.hypot(n.x - data.width / 2, n.y - data.height / 2) * 1.1) + i * 6}ms`,
                        } as React.CSSProperties
                      }
                    >
                      <circle
                        className="star-ring opacity-0"
                        cx={0}
                        cy={0}
                        r={n.r + 6}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                      />
                      <circle
                        className="lw-star-pulse"
                        cx={0}
                        cy={0}
                        r={n.r + 3}
                        fill="none"
                        stroke="var(--accent)"
                      />
                      {n.significance >= 4 && (
                        <circle
                          cx={0}
                          cy={0}
                          r={n.r + 5}
                          fill="var(--accent)"
                          opacity="0.14"
                        />
                      )}
                      <circle
                        className="lw-star-core"
                        cx={0}
                        cy={0}
                        r={n.r}
                        fill={
                          active || selected === n.id
                            ? "var(--accent)"
                            : "var(--fg)"
                        }
                        stroke="var(--bg-card)"
                        strokeWidth="2"
                      />
                      <text
                        x={0}
                        y={n.r + 15}
                        textAnchor="middle"
                        className={`lw-star-label pointer-events-none font-sans font-medium ${n.significance >= 3 || active || near ? "text-[12px]" : "text-[11px] opacity-70"} ${active ? "fill-[var(--accent)]" : "fill-[var(--fg)]"}`}
                      >
                        {n.name}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
            {predict && (
              <p className="t-label text-muted absolute bottom-3 left-4 max-w-[46ch]">
                Link prediction via Adamic–Adar over shared-stack edges.
                GraphSAGE was overkill for {data.nodes.length} nodes.
              </p>
            )}
          </div>
          <aside
            aria-live="polite"
            className="border-line border-t p-5 md:border-t-0 md:border-l"
          >
            {shown ? (
              <StarDetail
                node={shown}
                reasons={data.edges
                  .filter((e) => e.source === shown.id || e.target === shown.id)
                  .map((e) => {
                    const other = byId.get(
                      e.source === shown.id ? e.target : e.source,
                    )!;
                    return `${other.name}: ${e.reason}`;
                  })}
              />
            ) : (
              <div className="t-data text-muted space-y-3">
                <p>
                  Hover or focus a star to light its links. Click to open its
                  page. Drag one and it springs back.
                </p>
                <p>
                  Size = significance. Solid line = shared stack. Dotted =
                  shared cluster.
                </p>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div
          id="eqs-list"
          role="tabpanel"
          aria-label="List"
          className="divide-line divide-y"
        >
          {data.clusters.map((c) => {
            const members = data.nodes.filter(
              (n) =>
                n.cluster === c.id &&
                (!filter || n.clusters.includes(filter as StarNode["cluster"])),
            );
            if (!members.length) return null;
            return (
              <section
                key={c.id}
                aria-labelledby={`eqs-c-${c.id}`}
                className="px-4 py-5 md:px-6"
              >
                <h4 id={`eqs-c-${c.id}`} className="t-label text-muted mb-3">
                  {c.label}
                </h4>
                <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {members.map((n) => (
                    <li key={n.id} className="flex gap-3">
                      <span className="t-data text-accent w-12 shrink-0">
                        {n.mnemonic}
                      </span>
                      <span>
                        {n.page ? (
                          <Link href={n.page} className="link font-medium">
                            {n.name}
                          </Link>
                        ) : (
                          <a
                            href={n.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link font-medium"
                          >
                            {n.name}
                          </a>
                        )}
                        <span className="text-muted block text-[15px]">
                          {n.tagline}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StarDetail({ node, reasons }: { node: StarNode; reasons: string[] }) {
  return (
    <div>
      <p className="t-data text-accent">{node.mnemonic} &lt;GO&gt;</p>
      <h4 className="t-h3 mt-2">{node.name}</h4>
      <p className="text-muted mt-2 text-[15px]">{node.tagline}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {node.stack.slice(0, 5).map((s) => (
          <li key={s} className="chip">
            {s}
          </li>
        ))}
      </ul>
      {reasons.length > 0 && (
        <ul className="t-data text-muted mt-4 space-y-1">
          {reasons.slice(0, 4).map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        {node.page && (
          <Link href={node.page} className="pill pill-solid">
            Project page{" "}
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </Link>
        )}
        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className="pill"
        >
          {node.href.includes("github.com") ? "Code" : "Live"}{" "}
          <span className="arrow" aria-hidden="true">
            ↗
          </span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
