"use client";

import { useEffect } from "react";

/**
 * "or take the 40-second tour": starts (or stops) TOUR <GO>. It lives on the
 * home page, so it is also where a tour requested from another page resumes.
 */
export function TourLink({ className = "" }: { className?: string }) {
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let live = true;
    void import("./tour").then((m) => {
      if (live) cleanup = m.resumeTourIfPending();
    });
    return () => {
      live = false;
      cleanup?.();
    };
  }, []);

  return (
    <button
      type="button"
      data-tour-trigger=""
      onClick={() => void import("./tour").then((m) => m.tour())}
      className={`t-label text-muted hover:text-fg inline-flex min-h-10 items-center gap-2 transition-colors ${className}`}
    >
      <span aria-hidden="true" className="text-accent">
        ▶
      </span>
      or take the 40-second tour
    </button>
  );
}
