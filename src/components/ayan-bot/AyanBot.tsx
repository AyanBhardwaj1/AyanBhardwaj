"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePalette } from "../palette/PaletteProvider";
import "../sections/lower/bot.css";

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
  const palette = usePalette();

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
        data-open={open ? "" : undefined}
        tabIndex={open ? -1 : undefined}
        className="ab-launcher no-print group border-line-strong bg-bg-elev/90 text-fg hover:border-accent/60 focus-visible:border-accent fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[60] inline-flex size-12 items-center justify-center gap-2 rounded-full border font-mono text-[12px] tracking-wide shadow-[var(--shadow-float)] backdrop-blur-[12px] md:right-6 md:bottom-6 md:size-auto md:h-11 md:justify-start md:pr-4 md:pl-3"
      >
        <span aria-hidden="true" className="ab-dot relative flex size-2">
          <span className="bg-accent absolute inline-flex size-full animate-ping rounded-full opacity-60 [animation-iteration-count:4] motion-reduce:hidden" />
          <span className="bg-accent relative inline-flex size-2 rounded-full" />
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-5 md:hidden"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3H4A1.5 1.5 0 0 1 2.5 13V6A1.5 1.5 0 0 1 4 4.5Z" />
          <path d="m6.5 8 2 1.5-2 1.5M10.5 11h3" />
        </svg>
        <span className="hidden md:inline">
          <span className="text-muted group-hover:text-fg transition-colors">
            ask{" "}
          </span>
          ayan-bot
        </span>
        <span className="sr-only md:hidden">Ask ayan-bot</span>
        <span className="sr-only">: chat about Ayan&apos;s work</span>
      </button>
      {mounted && (
        <AyanBotPanel
          open={open}
          onClose={close}
          pending={pending}
          onBrowse={() => palette.open()}
        />
      )}
    </>
  );
}
