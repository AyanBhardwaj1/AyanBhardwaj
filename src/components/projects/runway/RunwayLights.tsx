"use client";

import { useEffect, useRef, useState } from "react";
import { monthLabel } from "./math";
import { s } from "./cls";

const LIGHTS = Array.from({ length: 13 }, (_, i) => 12 - i); // 12 … 0
const RUNWAY_MONTHS = 12.2;

/** Top view of a small jet, nose up. */
const JET =
  "M30 2 C33 2 34 7 34 12 L34 24 L58 38 L58 43 L34 36 L33 52 L41 58 L41 62 L30 59 L19 62 L19 58 L27 52 L26 36 L2 43 L2 38 L26 24 L26 12 C26 7 27 2 30 2 Z";

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
    // Only listen while the runway is near the viewport.
    let on = false;
    const attach = (yes: boolean) => {
      if (yes === on) return;
      on = yes;
      if (yes) {
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        onScroll();
      } else {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        // Settle on the right end when the user scrolled past quickly.
        read();
      }
    };
    const io = new IntersectionObserver(([e]) => attach(e.isIntersecting), {
      rootMargin: "25% 0px",
    });
    io.observe(el);
    read();
    return () => {
      io.disconnect();
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
          <span
            className={s.roll}
            style={
              {
                "--roll": `${4 + (Math.min(left, 12) / 12) * 88}%`,
              } as React.CSSProperties
            }
            data-zero={zero ? "" : undefined}
          >
            <svg viewBox="0 0 60 64" className={s.rollJet}>
              <path d={JET} />
            </svg>
          </span>
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
