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
        className={`no-print group ${open ? "hidden" : "inline-flex"} border-line-strong bg-bg-elev/90 text-fg hover:border-accent/60 focus-visible:border-accent fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[60] h-11 items-center gap-2 rounded-full border pr-4 pl-3 font-mono text-[12px] tracking-wide shadow-[var(--shadow-float)] backdrop-blur-[12px] transition-[border-color,transform] duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:right-6 md:bottom-6`}
      >
        <span aria-hidden="true" className="relative flex size-2">
          <span className="bg-accent absolute inline-flex size-full animate-ping rounded-full opacity-60 [animation-iteration-count:4] motion-reduce:hidden" />
          <span className="bg-accent relative inline-flex size-2 rounded-full" />
        </span>
        <span>
          <span className="text-muted group-hover:text-fg hidden transition-colors sm:inline">
            ask{" "}
          </span>
          ayan-bot
        </span>
        <span className="sr-only">: chat about Ayan&apos;s work</span>
      </button>
      {mounted && (
        <AyanBotPanel open={open} onClose={close} pending={pending} />
      )}
    </>
  );
}
