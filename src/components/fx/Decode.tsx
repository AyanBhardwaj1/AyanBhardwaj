"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "#$%&*+=<>/\\|01ABCDEFKLMNXYZ▲▼";
const DURATION = 820;

/**
 * Section title "decode": the first time a heading scrolls into view, its
 * characters resolve left to right from terminal glyphs into the real text.
 *
 * The real characters are server-rendered and never change: each sits in its
 * own span, so its width (and the line wrapping) is fixed by the real text.
 * While a character is unresolved its ink goes transparent and a glyph is
 * drawn over it from a data attribute (CSS ::after), so nothing reflows.
 * The parent heading carries the real text as its aria-label and this layer
 * is aria-hidden, so assistive tech only ever gets the real title. No JS or
 * reduced motion: plain text, nothing moves.
 */
export function Decode({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (
      !root ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const chars = [...root.querySelectorAll<HTMLElement>("[data-c]")];
    const n = chars.length;
    if (!n) return;
    let raf = 0;
    let lastSwap = 0;
    const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
    const clear = () => chars.forEach((c) => c.removeAttribute("data-g"));

    const run = () => {
      const t0 = performance.now();
      chars.forEach((c) => c.setAttribute("data-g", pick()));
      const tick = (now: number) => {
        const t = now - t0;
        const swap = now - lastSwap > 55;
        if (swap) lastSwap = now;
        let pending = 0;
        for (let i = 0; i < n; i++) {
          const c = chars[i];
          if (!c.hasAttribute("data-g")) continue;
          // Resolve times sweep left to right with a little jitter.
          const at = 120 + (i / n) * (DURATION - 260) + ((i * 37) % 7) * 9;
          if (t >= at) c.removeAttribute("data-g");
          else {
            pending++;
            if (swap) c.setAttribute("data-g", pick());
          }
        }
        if (pending && t < DURATION + 200) raf = requestAnimationFrame(tick);
        else clear();
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        run();
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clear();
    };
  }, [text]);

  // Words stay unbreakable (nowrap) so the per-character spans never split a
  // word across lines; spaces between words remain normal break points.
  const words = text.split(" ");
  return (
    <span ref={ref} aria-hidden="true" className="dx">
      {words.map((w, wi) => (
        <span key={wi}>
          <span className="dx-w">
            {[...w].map((ch, ci) => (
              <span key={ci} data-c="">
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
