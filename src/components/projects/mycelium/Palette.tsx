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
import { publishFind } from "./link";
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
export function Palette() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  // The query that produced `hits`, which lags the input by the debounce.
  const [hitQ, setHitQ] = useState("");
  const [source, setSource] = useState<Source>("LOCAL WASM");
  const [ms, setMs] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [warm, setWarm] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const listId = useId();
  const optId = (i: number) => `${listId}-o${i}`;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Tell the graph below which pages this search found.
  useEffect(() => {
    if (!q.trim()) publishFind(null);
    else if (hits)
      publishFind({ q: hitQ.trim(), ids: hits.map((h) => h.page.id) });
  }, [q, hits, hitQ]);
  useEffect(() => () => publishFind(null), []);

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
      setHitQ(text);
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
        setHitQ(text);
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
    <div
      className="myc-browser"
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
          {showRecent ? "Recently ingested" : `${count} results`}
          {!showRecent && count > 0 && (
            <a href="#myc-graph" className="myc-toGraph">
              lit in the graph below<span aria-hidden="true"> ↓</span>
            </a>
          )}
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
          {!showRecent && !hits && (
            <li className="myc-empty" role="presentation">
              Searching…
            </li>
          )}
        </ul>

        <div className="myc-footer">
          <span
            className="myc-badge"
            data-src={source === "LOCAL WASM" ? "wasm" : "cache"}
            aria-live="polite"
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

      <div className="myc-paletteNote">
        <p>
          Latency is measured in your browser over a 40-page demo index with a
          tiny hashed embedding, not Moss&apos;s model. The first query shows
          the real race: <b>LOCAL CACHE</b> answers while the index warms, then{" "}
          <b>LOCAL WASM</b> results replace it.
        </p>
        <button
          type="button"
          className="myc-ghost"
          onClick={() => {
            dropIndex();
            setWarm(false);
            setHits(null);
            setMs(null);
            if (q.trim()) run(q);
          }}
        >
          Restart cold
        </button>
      </div>
    </div>
  );
}
