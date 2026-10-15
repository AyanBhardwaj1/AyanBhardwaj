"use client";

import { formatAustin, nyseOpen, useNow } from "@/lib/time";

/** "● NYSE OPEN" / "○ NYSE CLOSED". Text, not just a colored dot. */
export function MarketStatus({ className = "" }: { className?: string }) {
  const now = useNow();
  const open = now === null ? null : nyseOpen(now);
  return (
    <span
      className={`items-center gap-1.5 ${className || "inline-flex"}`}
      aria-live="off"
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${open ? "bg-up" : "border-muted border"} ${open === null ? "opacity-0" : ""}`}
      />
      <span className={open === null ? "opacity-0" : ""}>
        {open ? "NYSE open" : "NYSE closed"}
      </span>
    </span>
  );
}

export function AustinClock({ className = "" }: { className?: string }) {
  const now = useNow();
  return (
    <time className={`tabular-nums ${className}`} aria-live="off">
      {now === null ? "--:--:-- CT" : formatAustin(now)}
    </time>
  );
}
