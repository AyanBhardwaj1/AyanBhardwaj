"use client";

import { useEffect, useRef, useState } from "react";
import { s } from "./cls";
import { onFirstView } from "./firstView";

const CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$.,/+-:";
const STEP_MS = 55;
const MAX_STEPS = 6;
const INTRO_STEPS = 8;
const ROW_TICKS = 4;

const pad = (t: string, n: number) =>
  t.toUpperCase().padEnd(n, " ").slice(0, n);

function path(from: string, to: string): string[] {
  if (from === to) return [];
  const a = Math.max(0, CHARSET.indexOf(from));
  const b = Math.max(0, CHARSET.indexOf(to));
  const out: string[] = [];
  for (let i = (a + 1) % CHARSET.length; ; i = (i + 1) % CHARSET.length) {
    out.push(CHARSET[i]);
    if (i === b) break;
  }
  return out.slice(-MAX_STEPS);
}

/** The intro spin: the last few flaps before `to`, whatever is showing. */
function spin(to: string): string[] {
  if (to === " ") return [];
  const b = Math.max(0, CHARSET.indexOf(to));
  const out: string[] = [];
  for (let k = INTRO_STEPS - 1; k >= 0; k--) {
    const ch = CHARSET[(b - k + CHARSET.length * 2) % CHARSET.length];
    if (ch !== " ") out.push(ch);
  }
  return out;
}

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Split-flap text. Server-renders the final characters; with JS and motion
 * allowed it flaps in from blank on mount and flaps to every new value.
 * With `cascade` (a row number) it instead waits blank until it is first on
 * screen, then spins in a beat after the row above: a board waking up.
 * Decorative: callers provide the readable text (this is aria-hidden).
 */
export function FlapText({
  text,
  cells,
  className = "",
  tone = "ink",
  cascade,
}: {
  text: string;
  cells: number;
  className?: string;
  tone?: "ink" | "cleared" | "amber";
  cascade?: number;
}) {
  const target = pad(text, cells);
  const [chars, setChars] = useState<string[]>(() => target.split(""));
  const [ticks, setTicks] = useState<number[]>(() => Array(cells).fill(0));
  const [ready, setReady] = useState(false);
  const el = useRef<HTMLSpanElement>(null);
  const shown = useRef<string[]>(target.split(""));
  const queues = useRef<string[][]>([]);
  const timer = useRef<number | null>(null);
  const mounted = useRef(false);
  const introDone = useRef(cascade === undefined);

  useEffect(() => {
    let cancelView = () => {};
    const animate = (goal: string[], row?: number) => {
      queues.current = goal.map((ch, i) => {
        const steps = row === undefined ? path(shown.current[i], ch) : spin(ch);
        if (!steps.length) return [];
        // Stagger left to right (and row by row in the intro).
        const wait = Array(Math.round(i * 0.6) + (row ?? 0) * ROW_TICKS).fill(
          shown.current[i],
        );
        return [...wait, ...steps];
      });
      if (timer.current) window.clearInterval(timer.current);
      timer.current = window.setInterval(() => {
        let busy = false;
        const next = [...shown.current];
        const changed: number[] = [];
        queues.current.forEach((q, i) => {
          if (!q.length) return;
          busy = true;
          const ch = q.shift()!;
          if (ch !== next[i]) changed.push(i);
          next[i] = ch;
        });
        shown.current = next;
        setChars(next);
        if (changed.length)
          setTicks((t) => t.map((v, i) => (changed.includes(i) ? v + 1 : v)));
        if (!busy && timer.current) {
          window.clearInterval(timer.current);
          timer.current = null;
        }
      }, STEP_MS);
    };
    // Work starts on the next frame (never synchronously in the effect).
    const raf = window.setTimeout(() => {
      const goal = target.split("");
      const startBlank = !mounted.current;
      mounted.current = true;
      setReady(true);
      if (reduced()) {
        shown.current = goal;
        setChars(goal);
        return;
      }
      if (startBlank) {
        shown.current = goal.map(() => " ");
        setChars(shown.current);
      }
      if (!introDone.current && el.current) {
        cancelView = onFirstView(
          el.current,
          () => {
            introDone.current = true;
            animate(goal, cascade);
          },
          0.6,
        );
        return;
      }
      animate(goal);
    }, 0);
    return () => {
      window.clearTimeout(raf);
      cancelView();
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
    };
  }, [target, cascade]);

  return (
    <span
      ref={el}
      aria-hidden="true"
      data-ready={ready ? "" : undefined}
      data-tone={tone}
      className={`${s.flap} ${className}`}
    >
      {chars.map((ch, i) => (
        <span key={i} className={s.cell}>
          <span key={ticks[i]} className={ticks[i] ? s.glyphFlip : s.glyph}>
            {ch === " " ? " " : ch}
          </span>
        </span>
      ))}
    </span>
  );
}
