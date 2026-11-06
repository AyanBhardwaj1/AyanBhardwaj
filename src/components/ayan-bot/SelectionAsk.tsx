"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import "./selection.css";

/**
 * "Ask ayan-bot" about selected text. Lives in the always-loaded launcher, so
 * it is deliberately tiny: no content imports, a few listeners, one button.
 * Shows for 8-200 selected characters of page text (not inputs, not the bot
 * panel), above the selection so it never covers it; on touch it waits for
 * the selection to settle. It never touches the selection itself, so native
 * selection, copy and the OS callout keep working. Esc dismisses it.
 */

const MIN = 8;
// Long selections are fine: the prompt quotes a trimmed excerpt.
const MAX = 1200;
const EXPLAIN = "Explain this from Ayan's site: ";
const EST_W = 136;
const EST_H = 36;
const GAP = 10;
const FIELD =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const SKIP = `${FIELD}, dialog, .ab-panel, .ab-sel, .ab-launcher`;

/** The prompt for a selection: trimmed, quotes escaped, under 300 characters. */
export function selectionPrompt(raw: string): string {
  const clean = raw.replace(/\s+/g, " ").trim();
  const esc = (s: string) => s.replace(/["“”]/g, '\\"');
  const budget = 299 - EXPLAIN.length - 2;
  let cut = clean;
  if (esc(cut).length > budget) {
    while (esc(cut).length > budget - 1) cut = cut.slice(0, -1);
    return `${EXPLAIN}"${esc(cut.trimEnd())}…"`;
  }
  return `${EXPLAIN}"${esc(cut)}"`;
}

type Spot = { text: string; x: number; y: number };

function readSelection(dismissed: string | null): Spot | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const text = sel.toString().replace(/\s+/g, " ").trim();
  if (text.length < MIN || text.length > MAX || text === dismissed) return null;
  // Text selected inside a field (some browsers report it here too).
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.closest(FIELD)) return null;
  const range = sel.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const el = node.nodeType === 1 ? (node as Element) : node.parentElement;
  if (!el || el.closest(SKIP)) return null;
  const box = range.getBoundingClientRect();
  if (!box.width && !box.height) return null;
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  // Off screen (scrolled away): hide rather than pin to an edge.
  if (box.bottom < 0 || box.top > vh) return null;
  const half = EST_W / 2;
  const x = Math.min(
    Math.max(box.left + box.width / 2, 16 + half),
    vw - 16 - half,
  );
  // Above the selection; below it only when there's no room above.
  const above = box.top - GAP - EST_H;
  const y = above >= 8 ? above : Math.min(box.bottom + GAP, vh - EST_H - 8);
  return { text, x, y };
}

export function SelectionAsk({
  onAsk,
  promptRef,
}: {
  onAsk: (prompt: string) => void;
  /** Holds the prompt while the button is showing (for the ⌘J shortcut). */
  promptRef: RefObject<string | null>;
}) {
  const [spot, setSpot] = useState<Spot | null>(null);
  const dismissedRef = useRef<string | null>(null);
  const shownRef = useRef<string | null>(null);
  const updateRef = useRef<() => void>(() => {});

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    let mouseDown = false;
    let timer = 0;
    let raf = 0;

    const update = () => {
      const next = readSelection(dismissedRef.current);
      shownRef.current = next?.text ?? null;
      setSpot((prev) =>
        prev?.text === next?.text && prev?.x === next?.x && prev?.y === next?.y
          ? prev
          : next,
      );
    };
    updateRef.current = update;
    const schedule = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, ms);
    };
    const onSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        // A new selection may reuse a dismissed text later.
        dismissedRef.current = null;
        window.clearTimeout(timer);
        if (shownRef.current) update();
        return;
      }
      if (mouseDown) return; // wait for pointerup
      schedule(fine.matches ? 140 : 480);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button === 0) {
        const t = e.target as Element | null;
        if (!t?.closest?.(".ab-sel")) mouseDown = true;
      }
    };
    const onUp = () => {
      if (!mouseDown) return;
      mouseDown = false;
      schedule(10);
    };
    const onMove = () => {
      if (raf || mouseDown) return;
      if (!shownRef.current) {
        // A selection that was off screen: show it once things settle.
        if (window.getSelection()?.isCollapsed === false)
          schedule(fine.matches ? 140 : 480);
        return;
      }
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !shownRef.current) return;
      // Dismiss first; the bot panel's own Esc handler skips prevented events.
      e.preventDefault();
      dismissedRef.current = shownRef.current;
      shownRef.current = null;
      setSpot(null);
    };

    document.addEventListener("selectionchange", onSelection);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
    window.addEventListener("resize", onMove);
    return () => {
      window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("selectionchange", onSelection);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
    };
  }, []);

  useEffect(() => {
    promptRef.current = spot ? selectionPrompt(spot.text) : null;
  }, [spot, promptRef]);

  // Text can still move without a scroll (reveal animations, late fonts or
  // images): re-check the spot a few times a second while it's showing.
  const showing = spot !== null;
  useEffect(() => {
    if (!showing) return;
    const t = window.setInterval(() => updateRef.current(), 250);
    return () => window.clearInterval(t);
  }, [showing]);

  if (!spot) return null;

  const ask = () => {
    dismissedRef.current = spot.text;
    shownRef.current = null;
    setSpot(null);
    onAsk(selectionPrompt(spot.text));
  };

  return (
    <button
      type="button"
      className="ab-sel no-print border-line-strong bg-bg-elev text-fg hover:border-accent/70 fixed z-[90] inline-flex h-9 items-center gap-2 rounded-full border pr-3.5 pl-3 font-mono text-[12px] tracking-wide whitespace-nowrap shadow-[var(--shadow-float)]"
      style={{ left: spot.x, top: spot.y }}
      // Keep the selection (and focus) where they are while clicking.
      onMouseDown={(e) => e.preventDefault()}
      onClick={ask}
      aria-keyshortcuts="Meta+J Control+J"
      title="Ask ayan-bot about this (⌘J / Ctrl+J)"
    >
      <span aria-hidden="true" className="bg-accent size-1.5 rounded-full" />
      Ask ayan-bot
      <span className="sr-only"> about the selected text</span>
    </button>
  );
}
