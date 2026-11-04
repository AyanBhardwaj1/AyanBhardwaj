"use client";

import { useEffect, useRef } from "react";

const PATTERN = /^([$~≈]?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/;

/**
 * Renders `value` as-is on the server (readable without JS). On the client, a
 * figure that starts with a number and is still below the fold resets to zero
 * and counts up once it scrolls into view. Anything else ("Winner",
 * "recall@5 0.85 → 0.97") is left alone, as is everything under reduced motion.
 */
export function CountUp({
  value,
  className,
  duration = 1300,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const m = PATTERN.exec(value);
    if (
      !el ||
      !m ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const [, pre, num, post] = m;
    const target = Number(num.replace(/,/g, ""));
    const decimals = num.split(".")[1]?.length ?? 0;
    const grouped = num.includes(",");
    const fmt = (n: number) =>
      pre +
      n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouped,
      }) +
      post;

    // Already on screen at load: leave the final figure, no flash.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.textContent = fmt(0);

    let frame = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(2, -10 * p);
          el.textContent = p >= 1 ? value : fmt(target * eased);
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = value;
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={`count-up ${className ?? ""}`}>
      {value}
    </span>
  );
}
