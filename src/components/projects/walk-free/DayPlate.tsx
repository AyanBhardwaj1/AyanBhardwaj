"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plan } from "./Plan";
import {
  allExposure,
  areaShare,
  compass,
  feelsLike,
  fmtHour,
  shadowsAt,
  sunAt,
  sunStroke,
} from "./world";

const H0 = 6;
const H1 = 20;
const DEG = 180 / Math.PI;

function caption(h: number, alt: number) {
  if (alt <= 0)
    return "Before sunrise. No direct sun reaches any path yet, so the whole walk is in shade.";
  if (h < 9)
    return "Morning. The low sun throws long shadows to the west and most paths are still shaded.";
  if (h < 12)
    return "Late morning. Shadows shorten and pull in under the buildings. The avenues start to bake.";
  if (h < 14)
    return "Midday. The sun is nearly overhead; only tree crowns still shade the paths.";
  if (h < 17)
    return "Afternoon, the hottest stretch. Shade survives under Cedar Lane's trees and in thin strips beside tall buildings.";
  if (h < 19)
    return "Evening. Shadows stretch east across the streets and the walk begins to cool.";
  return "Dusk. The sun sits low in the west-northwest and nearly every path is shaded again.";
}

/**
 * The signature piece: one street plan through one July day. Scrolling the
 * pinned section moves the clock from 6 AM to 8 PM (the slider mirrors and
 * drives it). Reduced motion: no pin, the slider alone, starting at 3 PM.
 */
export function DayPlate() {
  const ref = useRef<HTMLElement>(null);
  const [hour, setHour] = useState(15);
  const pinned = useRef(false);

  // Page-space position of the pinned section, measured on layout changes
  // only (never inside the scroll handler).
  const cache = useRef<{ top: number; travel: number } | null>(null);
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return null;
    const stage = el.firstElementChild as HTMLElement | null;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - (stage?.offsetHeight ?? 0);
    cache.current = { top: top - 48, travel: Math.max(1, travel) };
    return cache.current;
  }, []);
  const metrics = useCallback(() => cache.current ?? measure(), [measure]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    const onScroll = () => {
      if (!pinned.current || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const m = metrics();
        if (!m) return;
        const p = Math.min(1, Math.max(0, (window.scrollY - m.top) / m.travel));
        const h = Math.round((H0 + (H1 - H0) * p) * 12) / 12; // 5-minute steps
        setHour((prev) => (prev === h ? prev : h));
      });
    };
    const setup = () => {
      pinned.current = !mq.matches;
      if (pinned.current) onScroll();
      else setHour(15);
    };
    // Listen to scroll only while the section is near the viewport; settle
    // on the nearest end when it leaves.
    let on = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting === on) return;
        on = e.isIntersecting;
        if (on) window.addEventListener("scroll", onScroll, { passive: true });
        else window.removeEventListener("scroll", onScroll);
        onScroll();
      },
      { rootMargin: "10% 0px" },
    );
    io.observe(el);
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(document.documentElement);
    setup();
    mq.addEventListener("change", setup);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mq.removeEventListener("change", setup);
      window.removeEventListener("scroll", onScroll);
    };
  }, [measure, metrics]);

  const onSlide = (h: number) => {
    setHour(h);
    if (!pinned.current) return;
    const m = metrics();
    if (!m) return;
    const p = (h - H0) / (H1 - H0);
    window.scrollTo({ top: m.top + p * m.travel, behavior: "instant" });
  };

  const view = useMemo(() => {
    const shadows = shadowsAt(hour);
    const exposure = allExposure(shadows);
    const share = areaShare(exposure);
    const sun = sunAt(hour);
    const fl = feelsLike(hour);
    return { shadows, exposure, share, sun, fl };
  }, [hour]);

  const altDeg = Math.round(view.sun.alt * DEG);
  const up = view.sun.alt > 0;
  const shadedPct = Math.round(view.share * 100);
  const sunF = Math.round(up ? view.fl.sun : view.fl.shade);
  const shadeF = Math.round(view.fl.shade);
  const valueText = `${fmtHour(hour)}, ${shadedPct}% of paths shaded, ${sunF} °F in sun, ${shadeF} °F in shade`;

  return (
    <section
      ref={ref}
      className="wf-day"
      data-pin="1"
      aria-labelledby="wf-day-h"
    >
      <div className="wf-day-stage">
        <div className="wf-wrap grid w-full items-center gap-6 py-6 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <h2 id="wf-day-h" className="wf-h2">
              Same street, <em>every hour.</em>
            </h2>
            <p className="wf-coord mt-5" aria-hidden="true">
              July · 30.29° N 97.74° W · {fmtHour(hour)}
            </p>
            <div className="mt-3 flex items-end gap-4">
              <p className="wf-readout" aria-hidden="true">
                {sunF}°
              </p>
              <p className="wf-small pb-3 text-[16px]!" aria-hidden="true">
                <span className="block font-semibold text-(--wf-ink)">
                  feels like {up ? "in sun" : "now"}
                </span>
                {shadeF} °F in shade
                <br />
                {shadedPct}% of paths shaded
              </p>
            </div>
            <p
              className="wf-body mt-4 min-h-[5.2em] text-[17px]!"
              aria-live="off"
            >
              {caption(hour, view.sun.alt)}
            </p>
            <label
              htmlFor="wf-hour"
              className="mt-4 block text-[15px] font-semibold"
            >
              Time of day{" "}
              <span className="wf-num font-normal">({fmtHour(hour)})</span>
            </label>
            <input
              id="wf-hour"
              type="range"
              className="wf-range"
              min={H0}
              max={H1}
              step={0.25}
              value={hour}
              aria-valuetext={valueText}
              onChange={(e) => onSlide(Number(e.target.value))}
            />
            <div className="wf-small flex justify-between" aria-hidden="true">
              <span>6 AM</span>
              <span>Noon</span>
              <span>8 PM</span>
            </div>
          </div>
          <div className="relative lg:col-span-8">
            <Plan
              id="wf-day-plan"
              shadows={view.shadows}
              exposure={view.exposure}
              sunColor={sunStroke(view.fl.sunlight)}
              title={`An illustrative district at ${fmtHour(hour)} in July`}
              desc={`Building and tree shadows for the sun at ${altDeg} degrees${up ? ` from the ${compass(view.sun.az)}` : " (below the horizon)"}. ${shadedPct} percent of the paths are shaded. Solid blue paths are in shade, dashed paths are in direct sun.`}
            />
            <SunDial hour={hour} />
            <p className="wf-small mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <span>
                <span className="wf-swatch" aria-hidden="true" /> In shade
              </span>
              <span>
                <span className="wf-swatch wf-swatch-sun" aria-hidden="true" />{" "}
                In direct sun
              </span>
              <span>
                Sun{" "}
                {up
                  ? `${altDeg}° up, from the ${compass(view.sun.az)}`
                  : "below the horizon"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Polar sun-path diagram: N up, horizon at the rim, zenith at the centre. */
function SunDial({ hour }: { hour: number }) {
  const R = 64;
  const c = 80;
  const track = useMemo(() => {
    const pts: string[] = [];
    for (let h = 5.5; h <= 21; h += 0.1) {
      const s = sunAt(h);
      if (s.alt < 0) continue;
      const r = ((90 - s.alt * DEG) / 90) * R;
      pts.push(
        `${(c + r * Math.sin(s.az)).toFixed(1)},${(c - r * Math.cos(s.az)).toFixed(1)}`,
      );
    }
    return pts.join(" ");
  }, []);
  const s = sunAt(hour);
  const r = ((90 - Math.max(0, s.alt) * DEG) / 90) * R;
  const x = c + r * Math.sin(s.az);
  const y = c - r * Math.cos(s.az);
  return (
    <svg
      viewBox="0 0 160 160"
      className="absolute top-3 right-3 hidden w-[132px] bg-(--wf-paper) sm:block"
      aria-hidden="true"
    >
      <circle cx={c} cy={c} r={R} fill="var(--wf-paper-2)" />
      <circle
        cx={c}
        cy={c}
        r={R / 3}
        fill="none"
        stroke="var(--wf-paper-3)"
        strokeWidth="2"
      />
      <circle
        cx={c}
        cy={c}
        r={(2 * R) / 3}
        fill="none"
        stroke="var(--wf-paper-3)"
        strokeWidth="2"
      />
      <polyline
        points={track}
        fill="none"
        stroke="var(--wf-ink-soft)"
        strokeWidth="1.5"
        strokeDasharray="2 4"
      />
      {s.alt > 0 && (
        <>
          <line
            x1={c}
            y1={c}
            x2={x}
            y2={y}
            stroke="var(--wf-ink)"
            strokeWidth="1.5"
          />
          <circle
            cx={x}
            cy={y}
            r="9"
            fill="var(--wf-gold)"
            stroke="var(--wf-ink)"
            strokeWidth="2.5"
          />
        </>
      )}
      <text
        x={c}
        y="12"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="var(--wf-ink)"
      >
        N
      </text>
      <text
        x={c}
        y="156"
        textAnchor="middle"
        fontSize="12"
        fill="var(--wf-ink-soft)"
      >
        S
      </text>
      <text
        x="152"
        y={c + 4}
        textAnchor="middle"
        fontSize="12"
        fill="var(--wf-ink-soft)"
      >
        E
      </text>
      <text
        x="8"
        y={c + 4}
        textAnchor="middle"
        fontSize="12"
        fill="var(--wf-ink-soft)"
      >
        W
      </text>
    </svg>
  );
}
