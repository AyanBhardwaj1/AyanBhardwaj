"use client";

import { useEffect, useRef, useState } from "react";
import { s } from "./cls";

const CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$.,/+-:";
const STEP_MS = 55;
const MAX_STEPS = 6;

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

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Split-flap text. Server-renders the final characters; with JS and motion
 * allowed it flaps in from blank on mount and flaps to every new value.
 * Decorative: callers provide the readable text (this is aria-hidden).
 */
export function FlapText({
  text,
  cells,
  className = "",
  tone = "ink",
}: {
  text: string;
  cells: number;
  className?: string;
  tone?: "ink" | "cleared" | "amber";
}) {
  const target = pad(text, cells);
  const [chars, setChars] = useState<string[]>(() => target.split(""));
  const [ticks, setTicks] = useState<number[]>(() => Array(cells).fill(0));
  const [ready, setReady] = useState(false);
  const shown = useRef<string[]>(target.split(""));
  const queues = useRef<string[][]>([]);
  const timer = useRef<number | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    // Work starts on the next frame (never synchronously in the effect).
    const raf = window.setTimeout(() => run(), 0);
    const run = () => {
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
      queues.current = goal.map((ch, i) => {
        const steps = path(shown.current[i], ch);
        if (!steps.length) return [];
        // Stagger left to right: idle ticks before this cell starts.
        const wait = Array(Math.round(i * 0.6)).fill(shown.current[i]);
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
    return () => {
      window.clearTimeout(raf);
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
    };
  }, [target]);

  return (
    <span
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
