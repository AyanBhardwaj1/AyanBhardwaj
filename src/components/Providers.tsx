"use client";

import { useEffect } from "react";
import { stopScroll } from "@/lib/scroll";
import { PaletteProvider } from "./palette/PaletteProvider";

/** Internal route clicks first stop any smooth scroll still gliding. */
function useStopScrollOnRouteClick() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || a.target === "_blank") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname)
        return;
      stopScroll();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}

export function Providers({
  children,
  hasResume,
}: {
  children: React.ReactNode;
  hasResume: boolean;
}) {
  useStopScrollOnRouteClick();
  return <PaletteProvider hasResume={hasResume}>{children}</PaletteProvider>;
}
