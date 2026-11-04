import "./desk.css";

/**
 * Class names for THE DESK. This repo's Turbopack CSS rule turns *.module.css
 * into plain CSS, so the page uses one global sheet with every class prefixed
 * "yb-" and this map instead of CSS Modules: s.panel === "yb-panel".
 */
export const s = new Proxy({} as Record<string, string>, {
  get: (_, k) => `yb-${String(k)}`,
});
