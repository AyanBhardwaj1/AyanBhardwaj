"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PAGES, domainColor } from "./corpus";
import {
  dropIndex,
  hydrate,
  isHydrated,
  lexicalSearch,
  tokenize,
  vectorSearch,
  type Hit,
} from "./search";
import "./mycelium.css";

const SUGGESTIONS = [
  "agents that remember",
  "local-first privacy",
  "why cosine works",
  "chrome extension background work",
];

const RECENT = [0, 3, 4, 17, 12].map((i) => PAGES[i]);
const ago = (i: number) => ["2m", "14m", "1h", "3h", "yesterday", "2d"][i % 6];

type Source = "LOCAL WASM" | "LOCAL CACHE";

function Highlight({ text, q }: { text: string; q: string }) {
  const terms = new Set(tokenize(q));
  if (!terms.size) return <>{text}</>;
  return (
    <>
      {text
        .split(/(\s+)/)
        .map((w, i) =>
          terms.has(w.toLowerCase().replace(/[^a-z0-9]/g, "")) ? (
            <mark key={i}>{w}</mark>
          ) : (
            w
          ),
        )}
    </>
  );
}

/**
 * Inline replica of Mycelium's Shadow-DOM palette. Not a modal: it lives in
 * the page, so the site's own Cmd/Ctrl+K palette keeps working everywhere
 * else. Inside this demo, Cmd/Ctrl+K focuses the search field instead.
 */
/** Event the page dispatches to drop the index and refocus the palette. */
export const COLD_EVENT = "myc:restart-cold";

export function Palette({ autoplay = false }: { autoplay?: boolean }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [source, setSource] = useState<Source>("LOCAL WASM");
  const [ms, setMs] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [warm, setWarm] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const listId = useId();
  const optId = (i: number) => `${listId}-o${i}`;

  const root = useRef<HTMLDivElement>(null);
  const runRef = useRef<(t: string) => void>(() => {});
  const [demo, setDemo] = useState(autoplay);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    runRef.current = run;
  });

  // Autoplay: types a concept, lets the results land, walks the selection
  // down them, clears, and moves on to the next. Only while on screen and
  // the tab is visible; the first pointer, key or focus inside hands over.
  useEffect(() => {
    if (!demo) return;
    const el = root.current;
    if (!el) return;
    // Reduced motion: no autoplay (the "typing" tag is hidden in CSS).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    let t = 0;
    let k = 0;
    const queue: [number, () => void][] = [];
    const wait = (ms: number, fn: () => void) => queue.push([ms, fn]);
    const plan = () => {
      const sug = SUGGESTIONS[k++ % SUGGESTIONS.length];
      for (let i = 1; i <= sug.length; i++) {
        const v = sug.slice(0, i);
        wait(i === 1 ? 500 : 55 + ((i * 17) % 40), () => {
          setQ(v);
          runRef.current(v);
        });
      }
      [1, 2].forEach(() =>
        wait(900, () => setActive((a) => Math.min(a + 1, 7))),
      );
      wait(1700, () => {
        setQ("");
        runRef.current("");
        setActive(0);
      });
    };
    const step = () => {
      if (!visible || document.hidden) return;
      if (!queue.length) plan();
      const [ms, fn] = queue.shift()!;
      t = window.setTimeout(() => {
        fn();
        step();
      }, ms);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        const was = visible;
        visible = e.isIntersecting;
        if (visible && !was) step();
        if (!visible) window.clearTimeout(t);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    const onVis = () => {
      window.clearTimeout(t);
      if (!document.hidden) step();
    };
    document.addEventListener("visibilitychange", onVis);
    const stop = (e: Event) => {
      setDemo(false);
      // Taking over in the search field starts from a clean slate; a click
      // on a chip or a result keeps what the demo had found.
      if (e.target === input.current) {
        setQ("");
        runRef.current("");
        setActive(0);
      }
    };
    const evs = ["pointerdown", "keydown", "focusin"] as const;
    evs.forEach((e) => el.addEventListener(e, stop));
    return () => {
      window.clearTimeout(t);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      evs.forEach((e) => el.removeEventListener(e, stop));
    };
  }, [demo]);

  // Keep the selected row visible inside a scrolling result list, without
  // ever scrolling the page.
  useEffect(() => {
    const ul = document.getElementById(listId);
    const li = ul?.children[active] as HTMLElement | undefined;
    if (!ul || !li || ul.scrollHeight <= ul.clientHeight) return;
    const top = li.offsetTop - ul.offsetTop;
    if (top < ul.scrollTop) ul.scrollTop = top;
    else if (top + li.offsetHeight > ul.scrollTop + ul.clientHeight)
      ul.scrollTop = top + li.offsetHeight - ul.clientHeight;
  }, [active, listId]);

  // "Restart cold" lives in the Search chapter; it reaches the palette here.
  useEffect(() => {
    const onCold = () => {
      setDemo(false);
      dropIndex();
      setWarm(false);
      setHits(null);
      setMs(null);
      setQ("");
      runRef.current("");
      root.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
      input.current?.focus({ preventScroll: true });
    };
    window.addEventListener(COLD_EVENT, onCold);
    return () => window.removeEventListener(COLD_EVENT, onCold);
  }, []);

  function run(text: string) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setOpened(null);
    if (!text.trim()) {
      setHits(null);
      setMs(null);
      return;
    }
    const at = (t: number, fn: () => void) =>
      timers.current.push(window.setTimeout(fn, t));
    const cold = !isHydrated();
    const semantic = () => {
      const t0 = performance.now();
      const r = vectorSearch(text);
      const dt = performance.now() - t0;
      setHits(r);
      setSource("LOCAL WASM");
      setMs(dt);
      setActive(0);
      setWarm(true);
    };
    // 150 ms debounce, as in the extension.
    at(150, () => {
      if (!cold) return semantic();
      // Cold index: lexical fallback renders at ~250 ms, vectors replace it.
      at(100, () => {
        const t0 = performance.now();
        const r = lexicalSearch(text);
        setHits(r);
        setSource("LOCAL CACHE");
        setMs(performance.now() - t0);
        setActive(0);
      });
      at(650, () => {
        hydrate();
        semantic();
      });
    });
  }

  const list = hits ?? [];
  const showRecent = !q.trim();
  const count = showRecent ? RECENT.length : list.length;

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!count) return;
      setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + count) % count);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const page = showRecent ? RECENT[active] : list[active]?.page;
      if (page) setOpened(page.title);
    } else if (e.key === "Escape") {
      if (q) {
        e.preventDefault();
        e.stopPropagation();
        setQ("");
        run("");
      }
    }
  }

  return (
    <>
      {autoplay && (
        <p className="myc-heroDemoLabel">
          <span aria-hidden="true">●</span> Live demo, running on this page
          <em
            aria-hidden="true"
            className="myc-demoTag"
            data-on={demo || undefined}
          >
            · typing, click to take over
          </em>
        </p>
      )}
      <div
        ref={root}
        className="myc-browser"
        data-demo={demo ? "" : undefined}
        onKeyDownCapture={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            e.stopPropagation();
            input.current?.focus();
            input.current?.select();
          }
        }}
      >
        <div className="myc-chrome" aria-hidden="true">
          <span className="myc-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="myc-url">any-page-you-are-reading.com</span>
        </div>

        <div className="myc-palette">
          <div className="myc-searchRow">
            <svg viewBox="0 0 20 20" aria-hidden="true" className="myc-glass">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" />
            </svg>
            <input
              ref={input}
              role="combobox"
              aria-expanded={count > 0}
              aria-controls={listId}
              aria-activedescendant={count ? optId(active) : undefined}
              aria-autocomplete="list"
              aria-label="Search your reading by concept"
              placeholder="Search by idea, not title…"
              value={q}
              spellCheck={false}
              autoComplete="off"
              maxLength={80}
              onChange={(e) => {
                setQ(e.target.value);
                run(e.target.value);
              }}
              onKeyDown={onKey}
            />
            <kbd className="myc-kbd">⌘K</kbd>
          </div>

          <div className="myc-chips" role="group" aria-label="Try a concept">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => {
                  setQ(sug);
                  run(sug);
                  input.current?.focus();
                }}
              >
                {sug}
              </button>
            ))}
          </div>

          <p className="myc-listHead">
            {showRecent
              ? "Recently ingested"
              : hits
                ? `${count} result${count === 1 ? "" : "s"}`
                : "Searching…"}
          </p>
          <ul
            id={listId}
            role="listbox"
            aria-label="Results"
            className="myc-results"
          >
            {showRecent
              ? RECENT.map((p, i) => (
                  <li
                    key={p.id}
                    id={optId(i)}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setOpened(p.title)}
                  >
                    <i
                      style={{ background: domainColor(p.domain) }}
                      aria-hidden="true"
                    />
                    <span>
                      <strong>{p.title}</strong>
                      <small>
                        {p.domain} · {p.words.toLocaleString("en-US")} words
                      </small>
                    </span>
                    <time>{ago(i)}</time>
                  </li>
                ))
              : list.map((h, i) => (
                  <li
                    key={h.page.id}
                    id={optId(i)}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setOpened(h.page.title)}
                  >
                    <i
                      style={{ background: domainColor(h.page.domain) }}
                      aria-hidden="true"
                    />
                    <span>
                      <strong>
                        <Highlight text={h.page.title} q={q} />
                      </strong>
                      <small>
                        {h.page.domain} ·{" "}
                        <Highlight text={h.page.excerpt} q={q} />
                      </small>
                    </span>
                    <b>{h.score.toFixed(2)}</b>
                  </li>
                ))}
            {!showRecent && hits && !list.length && (
              <li className="myc-empty" role="presentation">
                Nothing close enough. Try a broader idea.
              </li>
            )}
            {!showRecent &&
              !hits &&
              [0, 1, 2].map((i) => (
                <li key={i} className="myc-skel" role="presentation">
                  <i />
                  <span />
                </li>
              ))}
          </ul>

          <div className="myc-footer">
            <span
              className="myc-badge"
              data-src={source === "LOCAL WASM" ? "wasm" : "cache"}
              aria-live={demo ? "off" : "polite"}
            >
              {showRecent ? (warm ? "MOSS READY" : "MOSS WARMING") : source}
            </span>
            <span className="myc-latency">
              {ms !== null && !showRecent ? `${ms.toFixed(2)} ms` : "—"}
            </span>
            <span className="myc-keys" aria-hidden="true">
              <kbd>↑</kbd>
              <kbd>↓</kbd> move <kbd>↵</kbd> open <kbd>esc</kbd> clear
            </span>
          </div>
          <p className="myc-opened" aria-live="polite">
            {opened ? `Would open “${opened}” in a new tab.` : ""}
          </p>
        </div>
      </div>
    </>
  );
}
