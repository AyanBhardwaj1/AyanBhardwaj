"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  onFirstView,
  prefersReducedMotion,
} from "@/components/motion/firstView";
import { s } from "./styles";

/**
 * The page's own command line. Section codes jump to a section; terminal
 * function codes (WACC, GP, IRAT...) jump to that row of the function table,
 * so "SNOW WACC" works like it does in the product. Without JS the function
 * keys are plain anchor links.
 *
 * The first time the bar is on screen it types one documented code itself
 * ("SNOW WACC", from the function table) and runs it through the same path
 * as Enter, minus the jump: a demo never scrolls the page or takes focus.
 * It stands down for reduced motion and the moment the visitor touches the
 * bar.
 */

const DEMO = "SNOW WACC";

export type DeskSection = { code: string; label: string; id: string };

export function CommandBar({
  sections,
  functions,
}: {
  sections: DeskSection[];
  functions: string[];
}) {
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("Type a code and press Enter, or pick a key.");
  const [active, setActive] = useState<string | null>(null);
  const inputId = useId();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [demo, setDemo] = useState<"typing" | "go" | null>(null);
  // The first-view demo's result isn't announced; visitors' own runs are.
  const [quiet, setQuiet] = useState(false);
  const touched = useRef(false);

  const words = q.trim().toUpperCase().split(/\s+/).filter(Boolean);
  const last = words.at(-1) ?? "";
  const matches = last
    ? [
        ...sections.filter((x) => x.code.startsWith(last)).map((x) => x.code),
        ...functions.filter((f) => f.startsWith(last)),
      ].slice(0, 6)
    : [];

  const go = (raw: string, opts: { demo?: boolean } = {}) => {
    setQuiet(!!opts.demo);
    const ws = raw.trim().toUpperCase().split(/\s+/).filter(Boolean);
    if (!ws.length) return;
    if (ws[0] === "?" || ws[0] === "HELP") {
      setMsg(
        `Sections: ${sections.map((x) => x.code).join(" ")}. Functions: ${functions.join(" ")}.`,
      );
      return;
    }
    const code = ws.at(-1)!;
    const ticker = ws.length > 1 ? ws[0] : null;
    const sec = sections.find((x) => x.code === code);
    const fn = functions.includes(code) ? code : null;
    const targetId = sec ? sec.id : fn ? `fn-${fn}` : null;
    if (!targetId) {
      setMsg(`${code}: no such code here. Try ? for the list.`);
      return;
    }
    const el = document.getElementById(targetId);
    if (!el) return;
    if (opts.demo) {
      // Same result as Enter, but the page stays where the visitor put it.
      setActive(sec ? sec.code : "FUNC");
      const key = sections.findIndex((x) => x.code === (sec?.code ?? "FUNC"));
      setMsg(
        `${ticker ? `${ticker} ` : ""}${sec ? sec.code : fn} <GO> · ${
          sec
            ? sec.label
            : `in the product this runs on ${ticker ?? "a ticker"}; here it opens the function table`
        } (F${key + 1})`,
      );
      setQ("");
      return;
    }
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // Move focus for keyboard and screen reader users without a second scroll.
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    el.setAttribute("data-loaded", String(Date.now()));
    setActive(sec ? sec.code : "FUNC");
    setMsg(
      sec
        ? `${sec.code} <GO> · ${sec.label}`
        : `${ticker ? `${ticker} ` : ""}${fn} <GO> · in the product this runs on ${ticker ?? "a ticker"}; here it opens the function table`,
    );
    setQ("");
  };

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    if (!functions.includes(DEMO.split(" ").at(-1)!)) return;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) =>
      timers.push(window.setTimeout(fn, ms));
    let running = false;
    const cancel = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.length = 0;
    };
    const onTouch = () => {
      touched.current = true;
      cancelView();
      setQuiet(false);
      if (running) {
        running = false;
        cancel();
        setDemo(null);
        setQ(""); // drop the half-typed demo so the visitor starts clean
      }
    };
    const busy = () =>
      touched.current ||
      el.contains(document.activeElement) ||
      (input.current?.value ?? "") !== "";
    const cancelView = onFirstView(
      el,
      () => {
        later(() => {
          if (busy()) return;
          running = true;
          setDemo("typing");
          let t = 0;
          for (let i = 1; i <= DEMO.length; i++) {
            // A human-ish rhythm: a beat after the ticker, quick within words.
            t += DEMO[i - 1] === " " ? 260 : 85 + ((i * 37) % 5) * 12;
            const part = DEMO.slice(0, i);
            later(() => setQ(part), t);
          }
          later(() => setDemo("go"), t + 520);
          later(() => {
            running = false;
            setDemo(null);
            go(DEMO, { demo: true });
          }, t + 700);
        }, 650);
      },
      0.6,
    );
    el.addEventListener("pointerdown", onTouch);
    el.addEventListener("keydown", onTouch);
    el.addEventListener("focusin", onTouch);
    return () => {
      cancelView();
      cancel();
      el.removeEventListener("pointerdown", onTouch);
      el.removeEventListener("keydown", onTouch);
      el.removeEventListener("focusin", onTouch);
    };
    // Runs once: the demo reads the first render's codes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={root} className={s.cmd} data-ui="">
      <div className="container-page flex flex-col gap-2 py-2 md:flex-row md:items-center md:gap-4">
        <form
          role="search"
          className={s.cmdForm}
          data-demo={demo ?? undefined}
          onSubmit={(e) => {
            e.preventDefault();
            go(q);
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Run a function code on this page
          </label>
          <span className={s.prompt} aria-hidden="true">
            &gt;
          </span>
          <input
            ref={input}
            id={inputId}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQ("");
              } else if (e.key === "Tab" && matches[0] && q.trim()) {
                const ws = q.trim().split(/\s+/);
                const next = [...ws.slice(0, -1), matches[0]].join(" ");
                if (next.toUpperCase() !== q.trim().toUpperCase()) {
                  e.preventDefault();
                  setQ(next);
                }
              }
            }}
            placeholder="ENGINE, STUDIO, SNOW WACC, ?"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-controls={listId}
            aria-describedby={`${listId}-msg`}
            className={s.cmdInput}
          />
          <button type="submit" className={s.goKey}>
            GO
          </button>
        </form>
        <nav aria-label="Page functions" className={s.keys}>
          <ul>
            {sections.map((x, i) => (
              <li key={x.code}>
                <a
                  href={`#${x.id}`}
                  className={active === x.code ? s.fkeyOn : s.fkey}
                  onClick={(e) => {
                    e.preventDefault();
                    go(x.code);
                  }}
                >
                  <span className={s.fnum} aria-hidden="true">
                    F{i + 1}
                  </span>
                  {x.code}
                  <span className="sr-only">: {x.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="container-page pb-2">
        <ul id={listId} className={s.matches} aria-label="Matching codes">
          {matches.map((m) => (
            <li key={m}>
              <button
                type="button"
                onClick={() => go([...words.slice(0, -1), m].join(" "))}
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
        <p
          id={`${listId}-msg`}
          className={s.cmdMsg}
          aria-live={quiet ? "off" : "polite"}
        >
          {msg}
        </p>
      </div>
    </div>
  );
}
