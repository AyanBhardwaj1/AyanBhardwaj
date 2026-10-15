"use client";

import { useEffect, useId, useRef, useState } from "react";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  external: boolean;
};

/**
 * Floating pill nav (design §5.1): top-center on desktop, docked bottom-center
 * on mobile. The ··· button expands the pill in place into chip links (CSS
 * grid-rows transition, no animation library). Scroll-spy marks the active
 * section with an amber dot. Esc and outside clicks close it (a non-modal disclosure).
 */
export function NavPill({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const menuId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const els = items
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const panel = ref.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!panel?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 md:top-14 md:bottom-auto">
      <div
        ref={ref}
        className={`border-line bg-bg-elev/85 pointer-events-auto rounded-[26px] border p-1.5 shadow-[var(--shadow-float)] backdrop-blur-[12px] transition-[width] duration-300 ${
          open ? "w-[min(100%,34rem)]" : "w-[15rem]"
        }`}
      >
        <nav aria-label="Primary">
          <div className="flex items-center gap-6">
            <a
              href="#top"
              className="rounded-full pl-3 font-mono text-[13px] font-medium tracking-tight"
            >
              ayan<span className="text-accent">://</span>bhardwaj
            </a>
            <button
              ref={buttonRef}
              type="button"
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((v) => !v)}
              className="bg-card text-fg hover:bg-card-hover ml-auto inline-flex size-9 items-center justify-center rounded-[10px] transition-colors"
            >
              <span className="sr-only">
                {open ? "Close menu" : "Open menu"}
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-4"
                fill="currentColor"
              >
                {open ? (
                  <path d="M4.2 3.1 8 6.9l3.8-3.8 1.1 1.1L9.1 8l3.8 3.8-1.1 1.1L8 9.1l-3.8 3.8-1.1-1.1L6.9 8 3.1 4.2z" />
                ) : (
                  <>
                    <circle cx="3" cy="8" r="1.3" />
                    <circle cx="8" cy="8" r="1.3" />
                    <circle cx="13" cy="8" r="1.3" />
                  </>
                )}
              </svg>
            </button>
          </div>
          <div id={menuId} className="collapsible" data-open={open}>
            <div>
              <ul className="flex flex-wrap gap-1.5 px-1 pt-3 pb-1">
                {items.map((l) => (
                  <li key={l.id}>
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={active === l.id ? "true" : undefined}
                      {...(l.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="border-line bg-card hover:border-line-strong hover:bg-card-hover inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors"
                    >
                      {active === l.id && (
                        <span
                          aria-hidden="true"
                          className="bg-accent size-1.5 rounded-full"
                        />
                      )}
                      {l.label}
                      {l.external && <span aria-hidden="true">↗</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
