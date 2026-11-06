"use client";

import { useEffect, useId, useRef, useState } from "react";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  external: boolean;
};

/** Below this scroll depth the pill always shows (the hero has room for it). */
const PINNED_ZONE = 160;
/** Scroll distance in one direction before the pill hides or returns. */
const INTENT = 12;

/**
 * Floating pill nav (design §5.1): top-center on desktop; on mobile it docks
 * bottom-left and shares that baseline with the round ayan-bot launcher. It steps out of the way while you read (hides on scroll down,
 * returns on scroll up, near the top, on focus, or while open), so it never
 * sits on body text. The collapsed pill names the section you are in
 * ("ayan://bhardwaj/projects"); the ··· button expands it in place into chip
 * links (CSS grid-rows transition). Esc and outside clicks close it.
 *
 * The scroll handler only reads window.scrollY (no layout reads) and writes one
 * data attribute per direction change; motion is a CSS transform transition.
 */
export function NavPill({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  /** Still on the hero: on phones the pill waits below it (CSS), so it never
   *  covers the hero's buttons. Starts true in the server HTML: no flash. */
  const [atTop, setAtTop] = useState(true);
  const menuId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Scroll-spy: the section crossing the middle band of the viewport.
  useEffect(() => {
    const els = items
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];
    const top = document.getElementById("top");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          setActive(e.target.id === "top" ? null : e.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    if (top) io.observe(top);
    return () => io.disconnect();
  }, [items]);

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    let lastY = window.scrollY;
    let anchorY = lastY;
    let dir = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const d = Math.sign(y - lastY);
      if (d !== 0 && d !== dir) {
        dir = d;
        anchorY = lastY;
      }
      lastY = y;
      setAtTop(y < window.innerHeight * 0.55);
      if (y < PINNED_ZONE) setHidden(false);
      else if (Math.abs(y - anchorY) > INTENT) setHidden(dir > 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Mirror the state on <html> so other fixed chrome (the ayan-bot launcher)
  // can step aside in sync: html[data-nav-hidden="true"].
  const isHidden = hidden && !open;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.navHidden = String(isHidden);
    return () => {
      delete root.dataset.navHidden;
    };
  }, [isHidden]);
  // ...and whether we're still on the hero (phones keep the bot launcher off
  // the hero's buttons too). The head script sets it before first paint.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.navAtTop = String(atTop && !open);
    return () => {
      delete root.dataset.navAtTop;
    };
  }, [atTop, open]);

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

  const current = items.find((i) => i.id === active);

  return (
    <div
      className="nav-dock no-print pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex justify-start px-4 md:top-12 md:bottom-auto md:justify-center"
      data-hidden={isHidden ? "true" : "false"}
      data-at-top={atTop && !open ? "true" : "false"}
    >
      <div
        ref={ref}
        className={`nav-pill border-line bg-bg-elev/90 pointer-events-auto rounded-[26px] border p-1.5 shadow-[var(--shadow-float)] backdrop-blur-[14px] backdrop-saturate-150 ${
          open
            ? "w-[calc(100%-3.5rem)] md:w-[min(100%,34rem)]"
            : "w-[calc(100%-3.5rem)] max-w-[20rem] md:w-[17.5rem]"
        }`}
      >
        <nav aria-label="Primary">
          <div className="flex items-center gap-3">
            <a
              href="#top"
              className="flex min-h-9 min-w-0 items-center rounded-full pl-3 font-mono text-[13px] font-medium tracking-tight"
            >
              <span className="shrink-0">
                ayan<span className="text-accent">://</span>bhardwaj
              </span>
              <span
                key={current?.id ?? "home"}
                aria-hidden="true"
                className="nav-seg text-muted truncate"
              >
                {current ? `/${current.id}` : ""}
              </span>
              <span className="sr-only">(back to top)</span>
            </a>
            <button
              ref={buttonRef}
              type="button"
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((v) => !v)}
              className="nav-btn bg-card text-fg hover:bg-card-hover ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors"
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
              <ul className="nav-chips flex flex-wrap gap-1.5 px-1 pt-3 pb-1">
                {items.map((l, i) => (
                  <li
                    key={l.id}
                    style={{ "--i": i } as React.CSSProperties}
                    className="nav-chip"
                  >
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={active === l.id ? "true" : undefined}
                      {...(l.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="border-line bg-card hover:border-line-strong hover:bg-card-hover aria-[current]:border-line-strong inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors"
                    >
                      {!l.external && (
                        <span aria-hidden="true" className="nav-led" />
                      )}
                      {l.label}
                      {l.external && (
                        <>
                          <span aria-hidden="true">↗</span>
                          <span className="sr-only">(opens in a new tab)</span>
                        </>
                      )}
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
