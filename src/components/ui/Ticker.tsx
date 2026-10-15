"use client";

import { useEffect, useRef, useState } from "react";

export type TickerItem = {
  symbol: string;
  value: string;
  delta?: "up" | "down" | "flat";
};

/**
 * Endless ticker tape. CSS marquee (duplicated track), pauses on hover, when
 * offscreen, and via a visible pause button (WCAG 2.2.2). Under reduced motion
 * it becomes a static, wrapped row. The moving track is aria-hidden; a plain
 * list carries the same content for assistive tech.
 */
export function Ticker({ items }: { items: TickerItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) =>
      setOffscreen(!e.isIntersecting),
    );
    io.observe(el);
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const row = (dup: boolean) => (
    <ul
      className={`flex shrink-0 items-center ${dup ? "ticker-dup motion-reduce:hidden" : ""}`}
    >
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-2 px-5 whitespace-nowrap">
          <span className="text-fg">{it.symbol}</span>
          {it.delta && it.delta !== "flat" && (
            <span className={it.delta === "up" ? "text-up" : "text-down"}>
              {it.delta === "up" ? "▲" : "▼"}
            </span>
          )}
          <span className="text-muted">{it.value}</span>
          <span aria-hidden="true" className="text-dim pl-5">
            ·
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      ref={ref}
      className="ticker border-line bg-bg t-data relative flex h-10 items-center border-y"
      data-paused={paused || offscreen || tabHidden ? "true" : "false"}
    >
      <ul className="sr-only">
        {items.map((it, i) => (
          <li key={i}>
            {it.symbol}: {it.value}
          </li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto"
      >
        <div className="ticker-track flex w-max motion-reduce:w-auto">
          {row(false)}
          {row(true)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="t-label border-line bg-bg text-muted hover:text-fg z-10 flex h-full shrink-0 items-center gap-1.5 border-l px-3 transition-colors motion-reduce:hidden"
      >
        <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>
        <span className="sr-only sm:not-sr-only">
          {paused ? "Play" : "Pause"}
        </span>
        <span className="sr-only"> ticker</span>
      </button>
    </div>
  );
}
