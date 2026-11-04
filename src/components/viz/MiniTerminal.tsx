"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * A static-first mock of the YouBank terminal (design wow #3). Demo data only,
 * labelled as such. Ticks only while visible and the tab is active; frozen
 * under reduced motion. Server render and first client render are identical
 * (seeded history), so there is no hydration mismatch.
 */
const BASE = [
  { sym: "NVDA", name: "NVIDIA Corp", px: 182.4, chg: 1.24 },
  { sym: "MSFT", name: "Microsoft Corp", px: 512.1, chg: -0.38 },
  { sym: "JPM", name: "JPMorgan Chase & Co", px: 301.7, chg: 0.52 },
  { sym: "GS", name: "Goldman Sachs Group", px: 788.2, chg: 0.91 },
  { sym: "BX", name: "Blackstone Inc", px: 171.9, chg: -1.1 },
  { sym: "SPY", name: "SPDR S&P 500 ETF", px: 664.3, chg: 0.27 },
];

const TABS = ["Watchlist", "Research", "AI summary"] as const;
const HIST = 40;

const SUMMARY =
  "Revenue +18% YoY on data-center demand. Gross margin held at 74.9% (10-Q, p.31). Guidance implies a softer Q4; watch inventory days.";

const CITES = [
  ["10-Q", "p.31", "Gross margin"],
  ["10-K", "Item 7", "Segment revenue"],
  ["8-K", "Ex. 99.1", "Q4 guidance"],
] as const;

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

type Row = (typeof BASE)[number] & { flash: -1 | 0 | 1; hist: number[] };

function initialRows(): Row[] {
  return BASE.map((r, k) => {
    const rand = seeded(11 + k * 7);
    // A Brownian bridge from the open (implied by chg%) to the last price, so
    // every intraday line agrees with its CHG% column.
    const open = r.px / (1 + r.chg / 100);
    let walk = 0;
    const steps = Array.from({ length: HIST }, () => (walk += rand() - 0.5));
    const end = steps[HIST - 1];
    const amp = r.px * 0.0022;
    const hist = steps.map((w, i) => {
      const t = i / (HIST - 1);
      return open + (r.px - open) * t + (w - end * t) * amp;
    });
    return { ...r, flash: 0, hist };
  });
}

function path(values: number[], w: number, h: number, pad = 1) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = pad + (1 - (v - lo) / span) * (h - pad * 2);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function Spark({ values, up }: { values: number[]; up: boolean }) {
  return (
    <svg
      viewBox="0 0 60 16"
      className="h-4 w-[60px]"
      aria-hidden="true"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d={path(values, 60, 16, 1.5)}
        stroke={up ? "var(--up)" : "var(--down)"}
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Chart({ row }: { row: Row }) {
  const W = 320;
  const H = 96;
  const d = path(row.hist, W, H, 6);
  const lo = Math.min(...row.hist);
  const hi = Math.max(...row.hist);
  const up = row.chg >= 0;
  const color = up ? "var(--up)" : "var(--down)";
  const lastY = 6 + (1 - (row.px - lo) / (hi - lo || 1)) * (H - 12);
  return (
    <div className="border-line flex h-full flex-col border-t pt-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="truncate">
          <span className="text-accent">{row.sym}</span>{" "}
          <span className="text-muted">US Equity · {row.name}</span>
        </p>
        <p className="text-muted shrink-0">
          GP <span className="text-fg">1D</span>
        </p>
      </div>
      <div className="relative min-h-24 flex-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="mt-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.28" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              x2={W}
              y1={H * f}
              y2={H * f}
              stroke="var(--line)"
              strokeDasharray="2 4"
            />
          ))}
          <path d={`${d} L${W} ${H} L0 ${H} Z`} fill="url(#mt-fill)" />
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="0"
            x2={W}
            y1={lastY}
            y2={lastY}
            stroke={color}
            strokeOpacity="0.5"
            strokeDasharray="1 3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          className="absolute right-0 -translate-y-1/2 rounded-sm px-1 text-[10px] text-black"
          style={{ top: `${(lastY / H) * 100}%`, background: color }}
        >
          {row.px.toFixed(2)}
        </span>
      </div>
      <div className="text-muted mt-1 flex justify-between text-[10px]">
        <span>09:30</span>
        <span>
          H <span className="text-fg">{hi.toFixed(2)}</span> · L{" "}
          <span className="text-fg">{lo.toFixed(2)}</span>
        </span>
        <span>16:00</span>
      </div>
    </div>
  );
}

export function MiniTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Watchlist");
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [sel, setSel] = useState(0);
  const [typed, setTyped] = useState(SUMMARY.length);
  const [live, setLive] = useState(false);
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;
    const io = new IntersectionObserver(
      ([e]) => setLive(e.isIntersecting && !document.hidden),
      { threshold: 0.3 },
    );
    io.observe(el);
    const onVis = () => document.hidden && setLive(false);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (!live || tab !== "Watchlist") return;
    const rand = seeded(7);
    const id = window.setInterval(() => {
      setTicks((t) => t + 1);
      setRows((prev) =>
        prev.map((r) => {
          if (rand() > 0.4) return { ...r, flash: 0 };
          const pct = (0.05 + rand() * 0.25) * (rand() > 0.45 ? 1 : -1);
          const px = r.px * (1 + pct / 100);
          return {
            ...r,
            px,
            chg: r.chg + pct,
            flash: pct > 0 ? 1 : -1,
            hist: [...r.hist.slice(1), px],
          };
        }),
      );
    }, 900);
    return () => window.clearInterval(id);
  }, [live, tab]);

  useEffect(() => {
    if (!live || tab !== "AI summary" || typed >= SUMMARY.length) return;
    const id = window.setTimeout(() => setTyped((t) => t + 1), 18);
    return () => window.clearTimeout(id);
  }, [live, tab, typed]);

  const breadth = useMemo(() => {
    const ups = rows.filter((r) => r.chg >= 0).length;
    return { ups, downs: rows.length - ups };
  }, [rows]);

  const row = rows[sel];

  return (
    <div
      ref={ref}
      data-theme="dark"
      className="border-line bg-bg text-fg flex h-full flex-col overflow-hidden rounded-lg border font-mono text-[12px]"
    >
      <div className="border-line text-muted flex items-center gap-2 border-b px-3 py-2">
        <span className="text-accent">&gt;</span>
        <span className="text-fg truncate">
          {tab === "Watchlist"
            ? `${row.sym} US Equity GP`
            : tab === "Research"
              ? `${row.sym} US Equity FA`
              : `${row.sym} US Equity CN`}
        </span>
        <span
          aria-hidden="true"
          className="term-cursor bg-accent inline-block h-3 w-1.5"
        />
        <span className="ml-auto shrink-0 rounded-sm bg-[var(--accent)] px-1.5 text-[10px] text-black">
          &lt;GO&gt;
        </span>
      </div>
      <div
        role="tablist"
        aria-label="Terminal demo"
        className="border-line flex border-b"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              if (t === "AI summary") setTyped(live ? 0 : SUMMARY.length);
            }}
            className={`min-h-10 px-3 tracking-wider uppercase transition-colors ${tab === t ? "bg-card text-accent" : "text-muted hover:text-fg"}`}
          >
            {t}
          </button>
        ))}
        <span className="text-muted ml-auto hidden items-center pr-3 text-[10px] sm:flex">
          DEMO DATA
        </span>
      </div>
      <div
        role="tabpanel"
        aria-label={tab}
        className="flex min-h-0 flex-1 flex-col gap-3 p-3"
      >
        {tab === "Watchlist" && (
          <>
            <table className="w-full tabular-nums">
              <caption className="sr-only">
                Illustrative watchlist with demo prices. Select a row to chart
                it.
              </caption>
              <thead className="text-muted">
                <tr>
                  <th className="pb-2 text-left font-normal">SYM</th>
                  <th className="hidden pb-2 text-left font-normal sm:table-cell">
                    <span className="sr-only">Trend</span>
                  </th>
                  <th className="pb-2 text-right font-normal">LAST</th>
                  <th className="pb-2 text-right font-normal">CHG%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.sym}
                    onClick={() => setSel(i)}
                    className={`cursor-pointer transition-colors duration-300 ${r.flash === 1 ? "bg-up/15" : r.flash === -1 ? "bg-down/15" : i === sel ? "bg-card" : "hover:bg-card"}`}
                  >
                    <td className="py-1 pl-1">
                      <button
                        type="button"
                        onClick={() => setSel(i)}
                        aria-pressed={i === sel}
                        className={`text-left ${i === sel ? "text-fg" : "text-accent"}`}
                      >
                        {i === sel && (
                          <span aria-hidden="true" className="text-accent">
                            ›{" "}
                          </span>
                        )}
                        {r.sym}
                      </button>
                    </td>
                    <td className="hidden py-1 sm:table-cell">
                      <Spark values={r.hist} up={r.chg >= 0} />
                    </td>
                    <td className="py-1 text-right">{r.px.toFixed(2)}</td>
                    <td
                      className={`py-1 pr-1 text-right ${r.chg > 0 ? "text-up" : r.chg < 0 ? "text-down" : "text-muted"}`}
                    >
                      {r.chg >= 0 ? "+" : ""}
                      {r.chg.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="min-h-32 flex-1">
              <Chart row={row} />
            </div>
          </>
        )}
        {tab === "Research" && (
          <div className="flex flex-1 flex-col gap-3">
            <p>
              <span className="text-accent">DES</span>{" "}
              <span className="text-muted">·</span> FA{" "}
              <span className="text-muted">·</span> VAR{" "}
              <span className="text-muted">·</span> CRDT{" "}
              <span className="text-muted">·</span> GP
            </p>
            <svg
              viewBox="0 0 200 60"
              className="h-20 w-full"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M0 48 20 44 36 46 52 34 70 38 88 26 104 30 122 18 140 22 160 12 180 16 200 6"
                stroke="var(--accent)"
                strokeWidth="1.5"
              />
            </svg>
            <dl className="border-line grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3">
              {[
                ["VaR 99% 1d", "2.31%"],
                ["Kupiec p", "0.41"],
                ["Altman Z''", "6.2"],
                ["EV/EBITDA", "31.4x"],
                ["Net debt", "-$41.2B"],
                ["FCF margin", "48.1%"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-muted mt-auto">
              source: 10-K FY25, XBRL us-gaap:Revenues
            </p>
          </div>
        )}
        {tab === "AI summary" && (
          <div className="flex flex-1 flex-col gap-4">
            <p className="leading-relaxed">
              <span className="text-accent">&gt; </span>
              {SUMMARY.slice(0, typed)}
              {typed < SUMMARY.length && (
                <span className="term-cursor bg-accent ml-0.5 inline-block h-3 w-1.5 align-middle" />
              )}
            </p>
            <ul className="border-line mt-auto space-y-1.5 border-t pt-3">
              {CITES.map(([form, loc, what], i) => (
                <li key={form} className="flex gap-2">
                  <span className="text-accent">[{i + 1}]</span>
                  <span className="text-fg">{form}</span>
                  <span className="text-muted">
                    {loc} · {what}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="border-line text-muted flex items-center gap-3 border-t px-3 py-1.5 text-[10px] tracking-wider uppercase">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${live ? "bg-up live-dot" : "bg-[var(--fg-dim)]"}`}
          />
          {live ? "Streaming" : "Paused"}
        </span>
        <span>
          <span className="text-up">▲{breadth.ups}</span>{" "}
          <span className="text-down">▼{breadth.downs}</span>
        </span>
        <span className="ml-auto tabular-nums">
          {String(ticks).padStart(4, "0")} ticks
        </span>
      </div>
    </div>
  );
}
