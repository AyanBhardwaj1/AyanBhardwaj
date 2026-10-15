"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ConstellationData, StarNode } from "@/lib/constellation";

/**
 * EQS <GO>: project constellation. Layout arrives precomputed from the server.
 * Map view (SVG, decorative for AT) and List view (semantic). The list is the
 * default below 768px. Roving focus with arrow keys on the map; Enter opens the
 * detail panel.
 */

const mq = "(min-width: 768px)";
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
  const [focusId, setFocusId] = useState<string>(data.nodes[0]?.id ?? "");
  const nodeRefs = useRef(new Map<string, SVGGElement>());

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

  const lit = hover ?? selected;
  const isDim = (n: StarNode) => {
    if (filter && !n.clusters.includes(filter as StarNode["cluster"]))
      return true;
    if (lit && lit !== n.id && !neighbors.get(lit)?.has(n.id)) return true;
    return false;
  };
  const sel = selected ? byId.get(selected) : undefined;

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
              viewBox={`0 0 ${data.width} ${data.height}`}
              className="h-auto w-full min-w-[640px]"
              role="group"
              aria-label="Project constellation map. Use arrow keys to move between projects and Enter to open one."
              onPointerLeave={() => setHover(null)}
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
                {data.edges.map((e) => {
                  const a = byId.get(e.source)!;
                  const b = byId.get(e.target)!;
                  const on = lit && (e.source === lit || e.target === lit);
                  return (
                    <line
                      key={`${e.source}-${e.target}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={on ? "var(--accent)" : "var(--fg)"}
                      strokeOpacity={on ? 0.8 : lit ? 0.06 : 0.16}
                      strokeWidth={on ? 1.25 : 1}
                    />
                  );
                })}
                {predict &&
                  data.predicted.map((e) => {
                    const a = byId.get(e.source)!;
                    const b = byId.get(e.target)!;
                    return (
                      <g key={`p-${e.source}-${e.target}`}>
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
              {data.nodes.map((n) => {
                const dim = isDim(n);
                const active = lit === n.id;
                return (
                  <g
                    key={n.id}
                    ref={(el) => {
                      if (el) nodeRefs.current.set(n.id, el);
                    }}
                    tabIndex={focusId === n.id ? 0 : -1}
                    role="button"
                    aria-label={`${n.name}: ${n.tagline}`}
                    aria-pressed={selected === n.id}
                    onPointerEnter={() => setHover(n.id)}
                    onFocus={() => {
                      setFocusId(n.id);
                      setHover(n.id);
                    }}
                    onBlur={() => setHover(null)}
                    onClick={() => setSelected(selected === n.id ? null : n.id)}
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
                      } else if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(selected === n.id ? null : n.id);
                      } else if (e.key === "Escape") {
                        setSelected(null);
                      }
                    }}
                    className="cursor-pointer outline-none [&:focus-visible_.star-ring]:opacity-100"
                    style={{
                      opacity: dim ? 0.18 : 1,
                      transition: "opacity 200ms",
                    }}
                  >
                    <circle
                      className="star-ring opacity-0"
                      cx={n.x}
                      cy={n.y}
                      r={n.r + 6}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2"
                    />
                    {n.significance >= 4 && (
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={n.r + 4}
                        fill="var(--accent)"
                        opacity="0.12"
                      />
                    )}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.r}
                      fill={
                        active || selected === n.id
                          ? "var(--accent)"
                          : "var(--fg)"
                      }
                      stroke="var(--bg-card)"
                      strokeWidth="2"
                    />
                    {(n.significance >= 3 || active) && (
                      <text
                        x={n.x}
                        y={n.y + n.r + 14}
                        textAnchor="middle"
                        className="pointer-events-none fill-[var(--fg)] font-sans text-[12px] font-medium"
                      >
                        {n.name}
                      </text>
                    )}
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
            {sel ? (
              <StarDetail
                node={sel}
                reasons={data.edges
                  .filter((e) => e.source === sel.id || e.target === sel.id)
                  .map((e) => {
                    const other = byId.get(
                      e.source === sel.id ? e.target : e.source,
                    )!;
                    return `${other.name}: ${e.reason}`;
                  })}
              />
            ) : (
              <div className="t-data text-muted space-y-3">
                <p>
                  Hover or focus a star to light its links. Click to open it.
                </p>
                <p>
                  Size = significance. Lines = shared stack or shared cluster.
                </p>
                {lit && byId.get(lit) && (
                  <p className="text-fg">
                    <span className="text-accent">
                      {byId.get(lit)!.mnemonic}
                    </span>{" "}
                    {byId.get(lit)!.name}
                  </p>
                )}
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
                        <a
                          href={n.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link font-medium"
                        >
                          {n.name}
                        </a>
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
      <a
        href={node.href}
        target="_blank"
        rel="noopener noreferrer"
        className="pill mt-5"
      >
        {node.href.includes("github.com") ? "Code" : "Live"}{" "}
        <span className="arrow" aria-hidden="true">
          ↗
        </span>
      </a>
    </div>
  );
}
