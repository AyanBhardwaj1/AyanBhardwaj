"use client";

import { useId, useLayoutEffect } from "react";

/**
 * Marks <html> while this case study is the page on screen:
 * data-page (its slug) and, for a fixed look, data-page-ground.
 *
 * Why not a CSS :has() on a marker inside the page: with cacheComponents,
 * Next keeps recently visited routes in the DOM (hidden), so a marker there
 * kept matching after you left (the launcher stayed dark on the home page).
 * Effects do follow visibility: they clean up when the route is hidden.
 * The token makes the old page's cleanup a no-op if the new page has
 * already set its own marks.
 */
export function PageMark({
  slug,
  ground,
}: {
  slug: string;
  ground?: "dark" | "light";
}) {
  const token = useId();
  useLayoutEffect(() => {
    const d = document.documentElement.dataset;
    d.pageMark = token;
    d.page = slug;
    if (ground) d.pageGround = ground;
    else delete d.pageGround;
    return () => {
      if (d.pageMark !== token) return;
      delete d.pageMark;
      delete d.page;
      delete d.pageGround;
    };
  }, [token, slug, ground]);
  return null;
}
