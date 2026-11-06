"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * Folds a block away on phones (behind a "Show …" button) and leaves it
 * open from tablets up. CSS does the hiding, so the server HTML is the same
 * everywhere and nothing shifts on hydration.
 */
export function MobileFold({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="mobile-fold" data-open={open ? "" : undefined}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="mobile-fold-btn pill min-h-10 md:hidden"
      >
        {open ? "Hide" : "Show"} {label}
      </button>
      <div id={id} className="mobile-fold-body">
        {children}
      </div>
    </div>
  );
}
