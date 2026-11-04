"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { onFirstView, prefersReducedMotion } from "./firstView";
import { capture, EXAMPLES, type Captured } from "./parse";
import { s } from "./styles";

/**
 * Quick Capture, with the workspace it files into. Typing shows the parse
 * live; Enter (or an example) files it, and the item flies from the parse
 * into its list (a FLIP) so the cause and effect are plain. The first time
 * the widget is on screen it types and files the first example itself,
 * unless the visitor got there first. Nothing is saved.
 */

/** The workspace lists parse.ts files into. */
const LISTS = [
  "Inbox",
  "Classes",
  "Deadlines",
  "Flashcards",
  "Applications",
  "Coding practice",
] as const;

const listOf = (filed: string) => filed.split(" › ")[0];
const titleOf = (c: Captured) => c.fields[0][1];

type Landed = { list: string; where: string; title: string; kind: string };

export function QuickCapture() {
  const [q, setQ] = useState(EXAMPLES[0]);
  const [landed, setLanded] = useState<Record<string, Landed>>({});
  const [last, setLast] = useState<{ list: string; n: number } | null>(null);
  const [demo, setDemo] = useState<"typing" | "file" | null>(null);
  const id = useId();
  const out = capture(q);
  const root = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLSpanElement>(null);
  const flyFrom = useRef<DOMRect | null>(null);
  const touched = useRef(false);

  const file = (line: string, opts: { animate?: boolean } = {}) => {
    const c = capture(line);
    if (!c) return;
    const list = listOf(c.filed);
    const rest = c.filed.split(" › ").slice(1).join(" › ");
    flyFrom.current =
      opts.animate !== false && !prefersReducedMotion()
        ? (source.current?.getBoundingClientRect() ?? null)
        : null;
    setLanded((m) => ({
      ...m,
      [list]: { list, where: rest, title: titleOf(c), kind: c.kind },
    }));
    setLast((p) => ({ list, n: (p?.n ?? 0) + 1 }));
  };

  // FLIP: the landed item starts where the parse sat and settles in its list.
  useLayoutEffect(() => {
    const from = flyFrom.current;
    flyFrom.current = null;
    if (!from || !last || !root.current) return;
    const el = root.current.querySelector<HTMLElement>(
      `[data-list="${last.list}"] [data-landed]`,
    );
    if (!el || typeof el.animate !== "function") return;
    const to = el.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const sx = Math.max(0.6, Math.min(2.5, from.width / to.width));
    el.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(${sx})`,
          opacity: 0.4,
        },
        { opacity: 1, offset: 0.6 },
        { transform: "none", opacity: 1 },
      ],
      {
        duration: 620,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "backwards",
      },
    );
  }, [last]);

  // First view: type the first example and file it, as a visitor would.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      // End state, no motion: the prefilled example is already filed.
      const t = window.setTimeout(
        () => file(EXAMPLES[0], { animate: false }),
        0,
      );
      return () => window.clearTimeout(t);
    }
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) =>
      timers.push(window.setTimeout(fn, ms));
    let running = false;
    const onTouch = () => {
      touched.current = true;
      cancelView();
      if (!running) return;
      running = false;
      timers.forEach((t) => window.clearTimeout(t));
      setDemo(null);
      setQ(EXAMPLES[0]); // back to the prefilled line, not a half-typed one
    };
    const input = el.querySelector("input");
    const busy = () =>
      touched.current ||
      el.contains(document.activeElement) ||
      input?.value !== EXAMPLES[0];
    const cancelView = onFirstView(
      el,
      () => {
        later(() => {
          if (busy()) return;
          running = true;
          setDemo("typing");
          setQ("");
          const line = EXAMPLES[0];
          let t = 120;
          for (let i = 1; i <= line.length; i++) {
            t += line[i - 1] === " " ? 70 : 34 + ((i * 29) % 4) * 9;
            const part = line.slice(0, i);
            later(() => setQ(part), t);
          }
          later(() => setDemo("file"), t + 520);
          later(() => {
            running = false;
            setDemo(null);
            file(line);
          }, t + 700);
        }, 450);
      },
      0.5,
    );
    el.addEventListener("pointerdown", onTouch);
    el.addEventListener("keydown", onTouch);
    el.addEventListener("focusin", onTouch);
    return () => {
      cancelView();
      timers.forEach((t) => window.clearTimeout(t));
      el.removeEventListener("pointerdown", onTouch);
      el.removeEventListener("keydown", onTouch);
      el.removeEventListener("focusin", onTouch);
    };
  }, []);

  const target = out ? listOf(out.filed) : null;
  const latest = last ? landed[last.list] : null;

  return (
    <div ref={root} className={s.capture} data-ui="">
      <div className={s.captureGrid}>
        <div className="min-w-0">
          <label htmlFor={id} className={s.captureLabel}>
            Quick Capture <kbd>⌘⇧K</kbd>
          </label>
          <form
            className={s.captureBar}
            data-demo={demo ?? undefined}
            onSubmit={(e) => {
              e.preventDefault();
              file(q);
            }}
          >
            <span aria-hidden="true" className={s.plus}>
              +
            </span>
            <input
              id={id}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder="Type anything: a deadline, a flashcard, an application"
              aria-describedby={`${id}-out`}
            />
            <button type="submit" className={s.fileKey} disabled={!out}>
              File <span aria-hidden="true">↵</span>
            </button>
          </form>
          <ul className={s.examples} aria-label="Try an example">
            {EXAMPLES.map((e) => (
              <li key={e}>
                <button
                  type="button"
                  aria-pressed={q === e}
                  onClick={() => {
                    setQ(e);
                    file(e);
                  }}
                >
                  {e}
                </button>
              </li>
            ))}
          </ul>
          <div
            id={`${id}-out`}
            aria-live="polite"
            aria-busy={demo === "typing"}
            className={s.captureOut}
          >
            {out ? (
              <>
                <p className={s.captureKind}>
                  <span
                    ref={source}
                    className={s.kindChip}
                    data-kind={out.kind}
                  >
                    {out.kind}
                  </span>
                  <span className={s.filed}>→ {out.filed}</span>
                </p>
                <dl className={s.captureFields}>
                  {out.fields.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className={s.filed}>
                Type a line to see where it would be filed.
              </p>
            )}
          </div>
        </div>

        <div className={s.tray}>
          <p className={s.ws}>
            <span className={s.wsIcon} aria-hidden="true">
              A
            </span>{" "}
            Ayan&apos;s term
          </p>
          <ul aria-label="Workspace lists">
            {LISTS.map((list) => {
              const item = landed[list];
              const fresh = last?.list === list;
              return (
                <li
                  key={list}
                  data-list={list}
                  data-target={target === list ? "" : undefined}
                  className={s.trayRow}
                >
                  <span className={s.trayName}>
                    {list}
                    {target === list && (
                      <span className="sr-only"> (where this line goes)</span>
                    )}
                  </span>
                  {item && (
                    <span
                      key={fresh ? last?.n : "settled"}
                      data-landed=""
                      data-fresh={fresh ? "" : undefined}
                      className={s.trayItem}
                    >
                      <span className={s.trayKind} data-kind={item.kind}>
                        {item.kind}
                      </span>
                      <span className={s.trayTitle}>{item.title}</span>
                      {item.where && (
                        <span className={s.trayWhere}>{item.where}</span>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="sr-only" aria-live="polite">
            {latest
              ? `Filed ${latest.title} to ${[latest.list, latest.where].filter(Boolean).join(" › ")}.`
              : ""}
          </p>
          <p className={s.trayNote}>Enter files it. Nothing is saved.</p>
        </div>
      </div>
    </div>
  );
}
