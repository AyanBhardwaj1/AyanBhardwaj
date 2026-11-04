"use client";

import { useId, useRef, useState } from "react";
import { s } from "./styles";

/**
 * The page's own command line. Section codes jump to a section; terminal
 * function codes (WACC, GP, IRAT...) jump to that row of the function table,
 * so "SNOW WACC" works like it does in the product. Without JS the function
 * keys are plain anchor links.
 */

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

  const words = q.trim().toUpperCase().split(/\s+/).filter(Boolean);
  const last = words.at(-1) ?? "";
  const matches = last
    ? [
        ...sections.filter((x) => x.code.startsWith(last)).map((x) => x.code),
        ...functions.filter((f) => f.startsWith(last)),
      ].slice(0, 6)
    : [];

  const go = (raw: string) => {
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

  return (
    <div className={s.cmd} data-ui="">
      <div className="container-page flex flex-col gap-2 py-2 md:flex-row md:items-center md:gap-4">
        <form
          role="search"
          className={s.cmdForm}
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
        <p id={`${listId}-msg`} className={s.cmdMsg} aria-live="polite">
          {msg}
        </p>
      </div>
    </div>
  );
}
