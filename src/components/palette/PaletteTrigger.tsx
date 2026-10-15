"use client";

import { usePalette } from "./PaletteProvider";

/**
 * Real link to /functions (works without JS); with JS it opens the palette.
 */
export function PaletteTrigger({
  className = "",
  label = "Search",
}: {
  className?: string;
  label?: string;
}) {
  const { open, prefetch } = usePalette();
  return (
    <a
      href="/functions"
      onClick={(e) => {
        e.preventDefault();
        open();
      }}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      aria-keyshortcuts="Meta+K Control+K"
      aria-label="Open command palette"
      className={className}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="7" cy="7" r="4.5" />
        <path d="m10.5 10.5 3 3" strokeLinecap="round" />
      </svg>
      <span className="hidden sm:inline">{label}</span>
      <kbd
        aria-hidden="true"
        className="hidden font-mono text-[0.6875rem] opacity-70 sm:inline"
      >
        ⌘K
      </kbd>
    </a>
  );
}
