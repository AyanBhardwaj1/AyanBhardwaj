/**
 * Halts an in-flight smooth scroll (an anchor glide from the nav pill or ⌘K).
 * Without this, following a link mid-glide lets the glide carry on into the
 * next page, which then opens part-way down instead of at the top.
 */
export const stopScroll = () =>
  window.scrollTo({ top: window.scrollY, behavior: "instant" });
