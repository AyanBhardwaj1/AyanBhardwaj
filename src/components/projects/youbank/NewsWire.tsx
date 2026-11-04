"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { s } from "./styles";

export type WireItem = {
  mono: string;
  source: string;
  form: string;
  desk: string;
  headline: string;
};

/**
 * A wire that adds a card every few seconds. It starts as four static cards
 * (also the no-JS and reduced-motion view), only moves while on screen, and
 * pauses on hover or focus.
 */
export function NewsWire({ items }: { items: WireItem[] }) {
  const [start, setStart] = useState(0);
  const [tick, setTick] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const visible = useRef(false);
  const list = useRef<HTMLOListElement>(null);
  const tallest = useRef(0);

  // A new card slides in on top and the rest are pushed down by its height
  // (FLIP, transform only). The list keeps the tallest height it has shown,
  // so headline lengths never make the section below jump.
  useLayoutEffect(() => {
    const ol = list.current;
    if (!ol) return;
    const h = ol.offsetHeight;
    if (h > tallest.current) {
      tallest.current = h;
      ol.style.minHeight = `${h}px`;
    }
    if (tick === 0) return;
    const first = ol.children[0] as HTMLElement | undefined;
    if (!first) return;
    const dy = first.offsetHeight;
    for (const li of Array.from(ol.children).slice(1)) {
      (li as HTMLElement).animate(
        [{ transform: `translateY(-${dy}px)` }, { transform: "none" }],
        { duration: 560, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    }
  }, [tick]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
    });
    io.observe(el);
    const t = window.setInterval(() => {
      if (paused.current || !visible.current || document.hidden) return;
      setStart((v) => (v - 1 + items.length) % items.length);
      setTick((v) => v + 1);
    }, 4000);
    return () => {
      io.disconnect();
      window.clearInterval(t);
    };
  }, [items.length]);

  const shown = Array.from(
    { length: 4 },
    (_, i) => items[(start + i) % items.length],
  );

  return (
    <div
      ref={root}
      className={s.wire}
      data-ui=""
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
    >
      <div className={s.panelBar}>
        <span>
          <span className={s.amber}>NEWS</span> · wire format
        </span>
        <span className={s.live}>
          <span className={s.liveDot} aria-hidden="true" /> every 10 min
        </span>
      </div>
      <ol ref={list} className={s.wireList}>
        {shown.map((it, i) => (
          <li
            key={`${it.form}-${i === 0 ? tick : (start + i) % items.length}`}
            className={i === 0 && tick > 0 ? s.wireNew : undefined}
          >
            <span className={s.mono} aria-hidden="true">
              {it.mono}
            </span>
            <div className="min-w-0">
              <p className={s.wireMeta}>
                <span className={s.srcChip}>{it.source}</span>
                <span>{it.form}</span>
                <span className={s.muted}>· {it.desk}</span>
              </p>
              <p className={s.wireHead}>{it.headline}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
