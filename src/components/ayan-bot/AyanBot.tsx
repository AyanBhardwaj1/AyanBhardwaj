"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * ayan-bot launcher. Always loaded and tiny: a floating button plus open
 * state. The chat panel (streaming, markdown, history) is its own chunk,
 * fetched on first hover/focus/open, so the home page's first-load JS barely moves.
 *
 * Other code can open it (e.g. an ASK <GO> command in the ⌘K palette):
 *   window.dispatchEvent(new CustomEvent("ayan-bot:open", { detail: { prompt: "..." } }))
 */

const loadPanel = () => import("./AyanBotPanel");
const AyanBotPanel = dynamic(loadPanel, { ssr: false });

export const AYAN_BOT_OPEN_EVENT = "ayan-bot:open";

export function AyanBot() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<{ text: string; id: number } | null>(
    null,
  );
  const launcherRef = useRef<HTMLButtonElement>(null);

  const show = useCallback((prompt?: string) => {
    setMounted(true);
    setOpen(true);
    if (prompt) setPending({ text: prompt, id: Date.now() });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the launcher once it's visible again.
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt?: unknown } | undefined>)
        .detail;
      show(typeof detail?.prompt === "string" ? detail.prompt : undefined);
    };
    window.addEventListener(AYAN_BOT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(AYAN_BOT_OPEN_EVENT, onOpen);
  }, [show]);

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => show()}
        onPointerEnter={() => void loadPanel()}
        onFocus={() => void loadPanel()}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`bot-launcher no-print group ${open ? "hidden" : "inline-flex"} border-line-strong bg-bg-elev/90 text-fg hover:border-accent/60 focus-visible:border-accent fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[60] size-[50px] items-center justify-center gap-2 rounded-full border font-mono text-[12px] tracking-wide shadow-[var(--shadow-float)] backdrop-blur-[12px] transition-[border-color,transform] duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:right-6 md:bottom-6 md:h-11 md:w-auto md:justify-start md:pr-4 md:pl-3`}
      >
        <span aria-hidden="true" className="relative hidden size-2 md:flex">
          <span className="bg-accent absolute inline-flex size-full animate-ping rounded-full opacity-60 [animation-iteration-count:4] motion-reduce:hidden" />
          <span className="bg-accent relative inline-flex size-2 rounded-full" />
        </span>
        {/* Compact chat glyph on phones, where it docks beside the nav pill. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5 md:hidden"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        >
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" />
          <circle cx="9" cy="9.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="9.5" r="1" fill="currentColor" stroke="none" />
        </svg>
        <span
          aria-hidden="true"
          className="bg-accent absolute top-2.5 right-2.5 size-2 rounded-full ring-2 ring-[var(--bg-elev)] md:hidden"
        />
        <span className="hidden md:inline">
          <span className="text-fg/70 group-hover:text-fg transition-colors">
            ask{" "}
          </span>
          ayan-bot
        </span>
        <span className="sr-only md:hidden">ayan-bot</span>
        <span className="sr-only">: chat about Ayan&apos;s work</span>
      </button>
      {mounted && (
        <AyanBotPanel open={open} onClose={close} pending={pending} />
      )}
    </>
  );
}
