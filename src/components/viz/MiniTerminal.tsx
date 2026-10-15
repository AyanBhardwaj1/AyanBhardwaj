"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A static-first mock of the YouBank terminal (design wow #3). Demo data only,
 * labelled as such. Ticks only while visible and the tab is active; frozen
 * under reduced motion.
 */
const BASE = [
  { sym: "NVDA", px: 182.4, chg: 1.24 },
  { sym: "MSFT", px: 512.1, chg: -0.38 },
  { sym: "JPM", px: 301.7, chg: 0.52 },
  { sym: "GS", px: 788.2, chg: 0.91 },
  { sym: "BX", px: 171.9, chg: -1.1 },
  { sym: "SPY", px: 664.3, chg: 0.27 },
];

const TABS = ["Watchlist", "Research", "AI summary"] as const;

const SUMMARY =
  "Revenue +18% YoY on data-center demand. Gross margin held at 74.9% (10-Q, p.31). Guidance implies a softer Q4; watch inventory days.";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function MiniTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Watchlist");
  const [rows, setRows] = useState(() =>
    BASE.map((r) => ({ ...r, flash: 0 as -1 | 0 | 1 })),
  );
  const [typed, setTyped] = useState(SUMMARY.length);
  const [live, setLive] = useState(false);

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
      setRows((prev) =>
        prev.map((r) => {
          if (rand() > 0.35) return { ...r, flash: 0 };
          const pct = (0.1 + rand() * 0.3) * (rand() > 0.45 ? 1 : -1);
          return {
            ...r,
            px: r.px * (1 + pct / 100),
            chg: r.chg + pct,
            flash: pct > 0 ? 1 : -1,
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

  return (
    <div
      ref={ref}
      data-theme="dark"
      className="border-line bg-bg text-fg flex h-full flex-col overflow-hidden rounded-lg border font-mono text-[12px]"
    >
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
      <div role="tabpanel" aria-label={tab} className="min-h-0 flex-1 p-3">
        {tab === "Watchlist" && (
          <table className="w-full tabular-nums">
            <caption className="sr-only">
              Illustrative watchlist with demo prices
            </caption>
            <thead className="text-muted">
              <tr>
                <th className="pb-2 text-left font-normal">SYM</th>
                <th className="pb-2 text-right font-normal">LAST</th>
                <th className="pb-2 text-right font-normal">CHG%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.sym}
                  className={`transition-colors duration-300 ${r.flash === 1 ? "bg-up/15" : r.flash === -1 ? "bg-down/15" : ""}`}
                >
                  <td className="text-accent py-1">{r.sym}</td>
                  <td className="py-1 text-right">{r.px.toFixed(2)}</td>
                  <td
                    className={`py-1 text-right ${r.chg > 0 ? "text-up" : r.chg < 0 ? "text-down" : "text-muted"}`}
                  >
                    {r.chg >= 0 ? "+" : ""}
                    {r.chg.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "Research" && (
          <div className="space-y-2">
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
            <p className="text-muted">
              VaR(99%, 1d) 2.31% · Kupiec p=0.41 · Altman Z&apos;&apos; 6.2
            </p>
            <p className="text-muted">
              source: 10-K FY25, XBRL us-gaap:Revenues
            </p>
          </div>
        )}
        {tab === "AI summary" && (
          <p className="leading-relaxed">
            <span className="text-accent">&gt; </span>
            {SUMMARY.slice(0, typed)}
            {typed < SUMMARY.length && (
              <span className="term-cursor bg-accent ml-0.5 inline-block h-3 w-1.5 align-middle" />
            )}
          </p>
        )}
      </div>
    </div>
  );
}
