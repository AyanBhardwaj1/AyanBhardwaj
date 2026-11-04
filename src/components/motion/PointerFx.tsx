"use client";

import { useEffect } from "react";

/**
 * One pointer listener for the hover layer:
 * - [data-glow]: sets --gx/--gy (px, element-local) for a cursor-follow light.
 * - [data-tilt]: sets --px/--py in -1..1 for small image parallax inside cards.
 * - [data-magnetic]: pulls the element a few px toward the cursor.
 * Fine pointers only; nothing runs under reduced motion. Transforms only, so
 * no layout shift.
 */
export function PointerFx() {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!fine || reduce) return;

    let frame = 0;
    let last: PointerEvent | null = null;
    let magnet: HTMLElement | null = null;

    const apply = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      const t = e.target instanceof Element ? e.target : null;

      const glow = t?.closest<HTMLElement>("[data-glow]");
      if (glow) {
        const r = glow.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        glow.style.setProperty("--gx", `${x}px`);
        glow.style.setProperty("--gy", `${y}px`);
        if (glow.hasAttribute("data-tilt")) {
          glow.style.setProperty("--px", ((x / r.width) * 2 - 1).toFixed(3));
          glow.style.setProperty("--py", ((y / r.height) * 2 - 1).toFixed(3));
        }
      }

      const m = t?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (magnet && magnet !== m) {
        magnet.style.translate = "";
      }
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        m.style.translate = `${(dx * 0.18).toFixed(1)}px ${(dy * 0.28).toFixed(1)}px`;
      }
    };

    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      if (magnet) magnet.style.translate = "";
      magnet = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return null;
}
