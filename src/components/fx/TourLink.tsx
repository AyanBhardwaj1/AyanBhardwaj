"use client";

/** "or take the 40-second tour": starts TOUR <GO> (module loads on click). */
export function TourLink({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
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
