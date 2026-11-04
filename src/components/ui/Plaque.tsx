"use client";

import { useId, useRef, useState } from "react";
import { CountUp } from "../motion/CountUp";
import { Emph } from "./Emph";
import "../sections/mid/mid.css";

/**
 * Trophy plaque: one card that turns over to its story on click / Enter /
 * Space (Escape turns it back). Both faces live on a single preserve-3d card,
 * so the flip reads as a solid object rather than two crossfading layers.
 * Fine pointers also get a 5° tilt toward the cursor and one sheen sweep per
 * enter. Reduced motion: the faces crossfade in place, no rotation.
 */
export function Plaque({
  numeral,
  numeralLabel,
  title,
  issuer,
  category,
  story,
  wide,
}: {
  numeral: string;
  numeralLabel: string;
  title: string;
  issuer: string;
  category: string;
  story: string;
  wide?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const backId = useId();

  function onMove(e: React.PointerEvent) {
    if (
      e.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * 5).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 5).toFixed(2)}deg`);
  }
  function onLeave() {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  }

  return (
    <li
      className={`plaque md-plq-li ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}
    >
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="md-plq-tilt"
      >
        <button
          type="button"
          aria-expanded={flipped}
          aria-controls={backId}
          data-flipped={flipped}
          onClick={() => setFlipped((f) => !f)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && flipped) setFlipped(false);
          }}
          className={`md-plq ${wide ? "h-60 md:h-52" : "h-80"}`}
        >
          <span className="sr-only">
            {title}, {issuer}.{" "}
            {flipped ? "Showing the story." : "Show the story."}
          </span>
          <span className="md-plq-card">
            <span aria-hidden="true" className="md-plq-face md-plq-front">
              <span
                className="sheen pointer-events-none absolute inset-0 rounded-[inherit]"
                aria-hidden="true"
              />
              <span className="flex items-start justify-between gap-4">
                <span className="t-label text-muted pt-2">{category}</span>
                <span className="md-plq-turn">
                  <svg viewBox="0 0 16 16" width="14" height="14">
                    <path
                      d="M13.5 6.5A5.5 5.5 0 0 0 3.2 4.6M2.5 9.5a5.5 5.5 0 0 0 10.3 1.9M3 1.8v3h3M13 14.2v-3h-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>
              <span
                className={`mt-auto block ${wide ? "md:flex md:items-end md:justify-between md:gap-10" : ""}`}
              >
                <span className="block">
                  <span
                    className={`md-plq-num text-fg block leading-[0.9] font-extrabold tracking-[-0.04em] [font-stretch:112%] tabular-nums`}
                  >
                    <CountUp value={numeral} />
                  </span>
                  <span className="t-label text-accent mt-2 block">
                    {numeralLabel}
                  </span>
                </span>
                <span
                  className={`mt-6 block ${wide ? "md:mt-0 md:max-w-[44ch] md:text-right" : ""}`}
                >
                  <span className="t-h3 block">{title}</span>
                  <span className="text-muted mt-1 block text-[15px]">
                    {issuer}
                  </span>
                </span>
              </span>
            </span>
            <span
              id={backId}
              aria-hidden={!flipped}
              className="md-plq-face md-plq-back justify-between"
            >
              <span className="flex items-center justify-between gap-4">
                <span className="t-label text-accent">The story</span>
                <span className="t-label text-muted">{category}</span>
              </span>
              <span
                className={`text-fg leading-relaxed ${wide ? "max-w-[60ch] text-[clamp(17px,1.6vw,20px)]" : "text-[17px]"}`}
              >
                <Emph text={story} />
              </span>
              <span className="t-label text-muted flex items-center gap-2">
                <span className="md-plq-turn md-plq-turn-sm" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="12" height="12">
                    <path
                      d="M13.5 6.5A5.5 5.5 0 0 0 3.2 4.6M2.5 9.5a5.5 5.5 0 0 0 10.3 1.9M3 1.8v3h3M13 14.2v-3h-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Flip back
              </span>
            </span>
          </span>
        </button>
      </div>
    </li>
  );
}
