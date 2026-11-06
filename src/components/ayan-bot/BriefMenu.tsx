"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BRIEF_PROMPT, BRIEF_ROLES } from "./derive";

/**
 * "Recruiter brief" split pill for the panel header: the main half asks for
 * the general brief, the caret opens a tiny disclosure with role-flavoured
 * variants. Esc closes the menu without closing the panel.
 */
export function BriefMenu({
  disabled,
  onPick,
}: {
  disabled?: boolean;
  onPick: (prompt: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector("button")?.focus();
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const pick = (prompt: string) => {
    setOpen(false);
    onPick(prompt);
  };

  const base =
    "border-line-strong hover:border-accent/70 hover:text-fg text-muted inline-flex h-8 items-center border font-mono text-[11px] tracking-wider uppercase transition-colors disabled:opacity-50";

  return (
    <div
      ref={wrapRef}
      className="relative flex"
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        // Prevented, so the panel's own Esc handler leaves the panel open.
        e.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
      }}
      onBlur={(e) => {
        if (open && !wrapRef.current?.contains(e.relatedTarget as Node))
          setOpen(false);
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => pick(BRIEF_PROMPT)}
        title="30-second recruiter brief"
        className={`${base} rounded-l-full pr-2 pl-2.5`}
      >
        <span className="sr-only">Recruiter </span>Brief
      </button>
      <button
        ref={toggleRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`${base} -ml-px rounded-r-full pr-2 pl-1.5`}
      >
        <span className="sr-only">Brief for a role</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={`size-3 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 4.5 3 3 3-3" />
        </svg>
      </button>
      <ul
        ref={listRef}
        id={id}
        hidden={!open}
        aria-label="Recruiter brief for a role"
        className="ab-menu border-line-strong bg-bg-elev absolute top-full right-0 z-10 mt-1.5 w-52 rounded-[12px] border p-1 shadow-[var(--shadow-float)]"
      >
        <li
          aria-hidden="true"
          className="text-muted px-2.5 pt-1.5 pb-1 font-mono text-[10px] tracking-[0.14em] uppercase"
        >
          Brief, tilted to
        </li>
        {BRIEF_ROLES.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => pick(r.prompt)}
              className="hover:bg-card focus-visible:bg-card flex min-h-9 w-full items-center justify-between gap-3 rounded-[8px] px-2.5 text-left text-[13px] disabled:opacity-50"
            >
              {r.long}
              <span
                aria-hidden="true"
                className="text-accent font-mono text-[10px] tracking-wider"
              >
                {r.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
