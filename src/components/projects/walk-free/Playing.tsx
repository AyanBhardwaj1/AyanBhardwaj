"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps decorative CSS loops and pauses them while they are off screen or the
 * tab is hidden (`data-playing` toggles; walkfree.css sets play-state).
 */
export function Playing({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let seen = false;
    const sync = () => {
      if (seen && !document.hidden) el.setAttribute("data-playing", "");
      else el.removeAttribute("data-playing");
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return (
    <div ref={ref} className={`wf-play ${className}`}>
      {children}
    </div>
  );
}
