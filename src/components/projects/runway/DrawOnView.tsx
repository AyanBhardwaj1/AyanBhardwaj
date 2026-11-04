"use client";

import { useEffect, useRef } from "react";
import { onFirstView, prefersReducedMotion } from "@/components/motion/firstView";

/**
 * A <figure> whose server-rendered drawing is complete without JS. With JS and
 * motion allowed it is armed (lines retracted) on mount and marked drawn the
 * first time it is properly on screen; runway.css does the drawing.
 */
export function DrawOnView({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !("IntersectionObserver" in window))
      return;
    el.dataset.armed = "";
    return onFirstView(el, () => (el.dataset.drawn = ""), 0.45);
  }, []);
  return (
    <figure ref={ref} className={className}>
      {children}
    </figure>
  );
}
