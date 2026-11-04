/**
 * Calls `cb` once, the first time `el` is at least `threshold` visible while
 * the tab is showing. Returns a cancel function (safe to call any time).
 * Without IntersectionObserver it never fires: callers must leave their
 * static end state in place until `cb` runs.
 */
export function onFirstView(
  el: Element,
  cb: () => void,
  threshold = 0.35,
): () => void {
  if (!("IntersectionObserver" in window)) return () => {};
  let done = false;
  let inView = false;
  const stop = () => {
    done = true;
    io.disconnect();
    document.removeEventListener("visibilitychange", fire);
  };
  function fire() {
    if (done || !inView || document.visibilityState !== "visible") return;
    stop();
    cb();
  }
  const io = new IntersectionObserver(
    ([e]) => {
      // Tall elements count once they fill that share of the viewport.
      inView =
        e.isIntersecting &&
        (e.intersectionRatio >= threshold * 0.99 ||
          e.intersectionRect.height >= window.innerHeight * threshold);
      fire();
    },
    // Dense steps so the height test above is re-checked as a tall element
    // scrolls (ratio alone can stall below `threshold` for it).
    { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
  );
  io.observe(el);
  document.addEventListener("visibilitychange", fire);
  return stop;
}

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
