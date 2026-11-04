import "./stack.css";

/**
 * Class names for the Stack page. This repo's Turbopack CSS rule turns
 * *.module.css into plain CSS, so the page uses one global sheet with every
 * class prefixed "st-" and this map instead: s.root === "st-root".
 */
export const s = new Proxy({} as Record<string, string>, {
  get: (_, k) => `st-${String(k)}`,
});
