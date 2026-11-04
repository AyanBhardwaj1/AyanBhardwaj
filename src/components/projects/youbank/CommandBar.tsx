"use client";

import { useEffect, useId, useRef, useState } from "react";
import { s } from "./styles";

/**
 * The page's own command line. Section codes jump to a section; terminal
 * function codes (WACC, GP, IRAT...) jump to that row of the function table,
 * so "SNOW WACC" works like it does in the product. Physical F1-F8 press the
 * matching key (as on a terminal keyboard), and the strip follows the section
 * in view. Without JS the function keys are plain anchor links.
 */

/** Once the jump settles, the target "loads" like a terminal screen: an amber
 * scan line wipes over it and the content resolves behind it. */
function loadScreen(el: HTMLElement) {
  const target =
    el.tagName === "TR" ? el : (el.querySelector<HTMLElement>("header") ?? el);
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    window.removeEventListener("scrollend", run);
    target.animate(
      [
        { clipPath: "inset(0 100% 0 0)", opacity: 0.35 },
        { clipPath: "inset(0 0 0 0)", opacity: 1 },
      ],
      { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    target.animate(
      [
        {
          boxShadow: "inset 3px 0 0 #f5a623",
          backgroundColor: "rgb(245 166 35 / 0.10)",
        },
        {
          boxShadow: "inset 3px 0 0 transparent",
          backgroundColor: "transparent",
        },
      ],
      { duration: 1100, easing: "ease-out" },
    );
  };
  window.addEventListener("scrollend", run, { once: true });
  window.setTimeout(run, 900);
}

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
  const strip = useRef<HTMLElement>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const goRef = useRef<(raw: string) => void>(() => {});

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
    if (!reduce) loadScreen(el);
    setActive(sec ? sec.code : "FUNC");
    setMsg(
      sec
        ? `${sec.code} <GO> · ${sec.label}`
        : `${ticker ? `${ticker} ` : ""}${fn} <GO> · in the product this runs on ${ticker ?? "a ticker"}; here it opens the function table`,
    );
    setQ("");
  };

  useEffect(() => {
    goRef.current = go;
  });

  // Physical F1-F8, like the function row on a terminal keyboard.
  useEffect(() => {
    let t = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const m = /^F([1-9])$/.exec(e.key);
      if (!m) return;
      const sec = sections[Number(m[1]) - 1];
      if (!sec) return;
      e.preventDefault();
      setPressed(sec.code);
      window.clearTimeout(t);
      t = window.setTimeout(() => setPressed(null), 220);
      goRef.current(sec.code);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [sections]);

  // Light the key of the section in view.
  useEffect(() => {
    const els = sections
      .map((x) => document.getElementById(x.id))
      .filter((x): x is HTMLElement => !!x);
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const sec = sections.find((x) => x.id === en.target.id);
          if (sec) setActive(sec.code);
        }
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  // Keep the lit key visible in the strip on narrow screens, without
  // scrolling the page itself.
  useEffect(() => {
    const nav = strip.current;
    const key = nav?.querySelector<HTMLElement>("[aria-current]");
    if (!nav || !key || nav.scrollWidth <= nav.clientWidth) return;
    const left = key.offsetLeft - (nav.clientWidth - key.offsetWidth) / 2;
    nav.scrollTo({ left, behavior: "smooth" });
  }, [active]);

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
        <nav ref={strip} aria-label="Page functions" className={s.keys}>
          <ul>
            {sections.map((x, i) => (
              <li key={x.code}>
                <a
                  href={`#${x.id}`}
                  className={active === x.code ? s.fkeyOn : s.fkey}
                  aria-current={active === x.code ? "location" : undefined}
                  aria-keyshortcuts={`F${i + 1}`}
                  data-pressed={pressed === x.code ? "" : undefined}
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
