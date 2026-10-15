"use client";

import { flushSync } from "react-dom";
import { getTheme, setTheme, useTheme } from "@/lib/prefs";

/**
 * Session toggle: ☾ AFTER HOURS (dark) / ☀ PRE-MARKET (light).
 * Circular view-transition reveal from the toggle; instant under reduced motion.
 */
export function switchTheme(origin?: { x: number; y: number }) {
  const next = getTheme() === "dark" ? "light" : "dark";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) {
    setTheme(next);
    return;
  }
  const x = origin?.x ?? window.innerWidth - 40;
  const y = origin?.y ?? 16;
  const r = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  const t = document.startViewTransition(() => flushSync(() => setTheme(next)));
  t.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${r}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 600,
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {});
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const dark = theme !== "light";
  const label = dark ? "After hours" : "Pre-market";
  return (
    <button
      type="button"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        switchTheme({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }}
      className={`border-line-strong hover:border-muted hover:text-fg inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 transition-colors ${className}`}
    >
      <span aria-hidden="true">{dark ? "☾" : "☀"}</span>
      {/* Accessible name contains the visible label (WCAG 2.5.3). */}
      <span
        className={`sr-only sm:not-sr-only ${theme === null ? "sm:opacity-0" : ""}`}
      >
        {label}
      </span>
      <span className="sr-only">
        {" "}
        session. Switch to {dark ? "Pre-market" : "After hours"}
      </span>
    </button>
  );
}
