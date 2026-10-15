"use client";

import { useRef, useState } from "react";

/**
 * Trophy plaque: flips to its story on click/Enter (crossfade under reduced
 * motion); tilts up to 6° toward the pointer on fine pointers, with one sheen
 * sweep per enter.
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
    el.style.setProperty("--rx", `${(-py * 6).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 6).toFixed(2)}deg`);
  }
  function onLeave() {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  }

  const face =
    "absolute inset-0 flex flex-col rounded-lg border border-line bg-card p-6 [backface-visibility:hidden] md:p-8";

  return (
    <li
      className={`plaque [perspective:800px] ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}
    >
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] transition-transform duration-300 ease-out [transform-style:preserve-3d]"
      >
        <button
          type="button"
          aria-expanded={flipped}
          onClick={() => setFlipped((f) => !f)}
          className={`relative block w-full text-left ${wide ? "h-56 md:h-48" : "h-80"} rounded-lg`}
        >
          <span className="sr-only">
            {title}, {issuer}. {flipped ? "Showing story. " : ""}
          </span>
          <span
            aria-hidden={flipped}
            className={`${face} transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-opacity ${
              flipped
                ? "[transform:rotateY(180deg)] opacity-0 motion-reduce:[transform:none]"
                : ""
            } ${wide ? "md:flex-row md:items-end md:justify-between md:gap-10" : ""}`}
          >
            <span
              className="sheen pointer-events-none absolute inset-0 rounded-lg"
              aria-hidden="true"
            />
            <span className="t-label text-muted">{category}</span>
            <span className={`${wide ? "mt-auto md:mt-0" : "mt-auto"} block`}>
              <span className="text-fg block text-[clamp(44px,5.2vw,80px)] leading-[0.9] font-extrabold tracking-[-0.04em] [font-stretch:112%] tabular-nums">
                {numeral}
              </span>
              <span className="t-label text-accent mt-2 block">
                {numeralLabel}
              </span>
            </span>
            <span
              className={`${wide ? "mt-6 md:mt-0 md:max-w-[22ch] md:text-right" : "mt-6"} block`}
            >
              <span className="t-h3 block">{title}</span>
              <span className="text-muted mt-1 block text-[15px]">
                {issuer}
              </span>
            </span>
          </span>
          <span
            aria-hidden={!flipped}
            className={`${face} justify-between transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-opacity ${
              flipped
                ? ""
                : "[transform:rotateY(-180deg)] opacity-0 motion-reduce:[transform:none]"
            }`}
          >
            <span className="t-label text-accent">Story</span>
            <span className="text-fg text-[17px] leading-relaxed">{story}</span>
            <span className="t-label text-muted">Tap to flip back</span>
          </span>
        </button>
      </div>
    </li>
  );
}
