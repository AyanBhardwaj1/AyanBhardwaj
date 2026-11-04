"use client";

import { useEffect, useRef, useState } from "react";
import { monthLabel } from "./math";
import { s } from "./cls";

const LIGHTS = Array.from({ length: 13 }, (_, i) => 12 - i); // 12 … 0
const RUNWAY_MONTHS = 12.2;

/**
 * Thirteen pairs of runway edge lights, 12 months down to 0. Scrolling past
 * plays the year forward and puts one pair out per month. Reduced motion or
 * no JS: every light stays lit and the list reads as a plain countdown.
 */
export function RunwayLights() {
  const ref = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.75;
      const end = vh * 0.25 - r.height;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
      setElapsed(Math.round(p * RUNWAY_MONTHS * 10) / 10);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const left = Math.max(0, RUNWAY_MONTHS - elapsed);
  const out = (k: number) => elapsed > 12 - k + 0.05;
  const zero = left <= 0.05;
  const now = monthLabel(Math.min(12, Math.floor(elapsed)));

  return (
    <div ref={ref} className={s.lightsWrap}>
      <div className={s.runwayView} aria-hidden="true">
        <div className={s.runwayPlane}>
          <span className={s.threshold} data-on={zero ? "" : undefined} />
          {LIGHTS.map((k) => (
            <div
              key={k}
              className={s.lightRow}
              style={{ top: `${4 + (k / 12) * 88}%` }}
              data-out={out(k) ? "" : undefined}
            >
              <span className={s.lamp} />
              <span className={s.paint}>{k % 3 === 0 ? k : ""}</span>
              <span className={s.lamp} />
            </div>
          ))}
          <span className={s.centerline} />
        </div>
      </div>

      <div className={s.lightsText}>
        <p className={s.lightsNow}>
          <span className={s.lightsBig}>{left.toFixed(1)}</span> months of cash
          left
          <span className={s.lightsSub}>
            {zero ? "November 3, 2027: zero cash" : `as of ${now}`}
          </span>
        </p>
        <ol className={s.lightsList} aria-label="Months of cash left">
          {LIGHTS.map((k) => (
            <li key={k} data-out={out(k) ? "" : undefined}>
              <span className={s.lightsK}>{k}</span>
              <span>{monthLabel(12 - k)}</span>
              <span className={s.lightsState}>{out(k) ? "spent" : "lit"}</span>
            </li>
          ))}
          <li data-zero="">
            <span className={s.lightsK}>0.0</span>
            <span>Nov 3, 2027</span>
            <span className={s.lightsState}>zero cash</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
