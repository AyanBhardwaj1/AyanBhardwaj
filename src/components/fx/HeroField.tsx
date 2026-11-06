"use client";

import { useEffect, useRef } from "react";

/**
 * Host for the hero's after-hours field. Server-renders an absolutely
 * positioned, aria-hidden layer with a static CSS gradient (the fallback, and
 * all that reduced-motion / no-WebGL visitors ever see). After the page has
 * loaded and the main thread is idle, the WebGL module is fetched and draws
 * on top of the gradient, fading in. Never in the layout flow, never
 * interactive, never part of the first paint.
 */
export function HeroField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as { connection?: { saveData?: boolean } })
      .connection?.saveData;
    if (reduce.matches || saveData) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;
    let idle = 0;
    let timer = 0;

    const boot = () => {
      if (cancelled) return;
      void import("./field-gl")
        .then(({ startField }) => {
          if (cancelled) return;
          cleanup = startField(host, {
            onFail: () => host.setAttribute("data-fallback", ""),
          });
        })
        .catch(() => {});
    };
    const whenIdle = () => {
      const ric = window.requestIdleCallback;
      if (ric) idle = ric(boot, { timeout: 3000 });
      else timer = window.setTimeout(boot, 1200);
    };
    const onLoad = () => {
      timer = window.setTimeout(whenIdle, 400);
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    // Turning reduced motion on mid-session stops the field.
    const onReduce = () => {
      if (!reduce.matches) return;
      cleanup?.();
      cleanup = null;
    };
    reduce.addEventListener("change", onReduce);

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
      reduce.removeEventListener("change", onReduce);
      if (idle) window.cancelIdleCallback?.(idle);
      clearTimeout(timer);
      cleanup?.();
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="hx-field" />;
}
