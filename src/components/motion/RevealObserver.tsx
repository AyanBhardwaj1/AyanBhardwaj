"use client";

import { useEffect } from "react";

const SELECTOR =
  "[data-reveal]:not(.is-in), [data-reveal-stagger]:not(.is-in), [data-inview]:not(.is-in)";

/**
 * One IntersectionObserver for every [data-reveal] element on the page (fade
 * up and variants), every [data-reveal-stagger] group, and every [data-inview]
 * element (just gets .is-in, for effects such as the section rule draw-in).
 * A MutationObserver picks up elements that mount later (lazy islands,
 * client-rendered panels), so nothing can stay stuck in its hidden state.
 */
export function RevealObserver() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      document
        .querySelectorAll<HTMLElement>(SELECTOR)
        .forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );
    const seen = new WeakSet<Element>();
    const scan = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    scan(document);

    let pending = 0;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        scan(document);
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(pending);
      mo.disconnect();
      io.disconnect();
    };
  }, []);
  return null;
}
