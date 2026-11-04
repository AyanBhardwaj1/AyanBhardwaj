"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import "./mycelium.css";

type Verdict = "ingest" | "short" | "sensitive" | "revisit";
const TABS: { url: string; title: string; words: number; verdict: Verdict }[] =
  [
    {
      url: "dev.to/building-agents-that-remember",
      title: "Building agents that remember",
      words: 1840,
      verdict: "ingest",
    },
    {
      url: "medium.com/local-first-software",
      title: "Local-first software",
      words: 2310,
      verdict: "ingest",
    },
    {
      url: "news.example.com/quick-update",
      title: "Quick product update",
      words: 212,
      verdict: "short",
    },
    {
      url: "bank.example.com/accounts/checking",
      title: "Checking account",
      words: 0,
      verdict: "sensitive",
    },
    {
      url: "arxiv.org/abs/self-improving-agents",
      title: "Self-improving AI agents",
      words: 3120,
      verdict: "revisit",
    },
  ];

const LABEL: Record<Verdict, string> = {
  ingest: "Ingested · new memory",
  short: "Skipped · under 500 readable words",
  sensitive: "Skipped · sensitive-site guard (banking)",
  revisit: "Revisit · same URL hash, 1 memory updated",
};

const mq = () => window.matchMedia("(prefers-reduced-motion: reduce)");
const useReduced = () =>
  useSyncExternalStore(
    (cb) => {
      const m = mq();
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => mq().matches,
    () => false,
  );

/** Five tabs run Mycelium's real gates; survivors drop into storage as spores. */
export function Ingest() {
  const reduce = useReduced();
  // step: index of the tab being read; TABS.length = all done. Server
  // render shows the finished state so the outcome reads without JS.
  const [step, setStep] = useState(TABS.length);
  const [counts, setCounts] = useState<number[]>(TABS.map((t) => t.words));
  const root = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  function play() {
    cancelAnimationFrame(raf.current);
    if (reduce) {
      setCounts(TABS.map((t) => t.words));
      setStep(TABS.length);
      return;
    }
    setCounts(TABS.map(() => 0));
    setStep(0);
    const start = performance.now();
    const per = 900;
    const loop = (now: number) => {
      const t = now - start;
      const i = Math.min(TABS.length, Math.floor(t / per));
      const frac = Math.min(1, (t % per) / (per * 0.7));
      setCounts(
        TABS.map((tab, j) =>
          j < i ? tab.words : j === i ? Math.round(tab.words * frac) : 0,
        ),
      );
      setStep(i);
      if (i < TABS.length) raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          play();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf.current);
    };
    // play reads reduce at call time; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = (i: number) => step > i || step >= TABS.length;
  const stored = TABS.filter(
    (t, i) => done(i) && t.verdict === "ingest",
  ).length;
  const updated = TABS.filter(
    (t, i) => done(i) && t.verdict === "revisit",
  ).length;

  return (
    <div className="myc-ingest" ref={root}>
      <ol className="myc-tabs">
        {TABS.map((t, i) => {
          const fin = done(i);
          const ok = t.verdict === "ingest" || t.verdict === "revisit";
          return (
            <li
              key={t.url}
              data-state={
                fin ? (ok ? "ok" : "skip") : step === i ? "reading" : "idle"
              }
            >
              <span className="myc-tabUrl">{t.url}</span>
              <strong>{t.title}</strong>
              <span className="myc-meter" aria-hidden="true">
                <i
                  style={
                    {
                      "--p": Math.min(1, (counts[i] ?? 0) / 500),
                    } as React.CSSProperties
                  }
                />
              </span>
              <span className="myc-count">
                {t.verdict === "sensitive"
                  ? "not read"
                  : `${(counts[i] ?? 0).toLocaleString("en-US")} words`}
              </span>
              <span className="myc-verdict">
                {fin
                  ? LABEL[t.verdict]
                  : step === i
                    ? "Readability pass…"
                    : "Waiting"}
              </span>
              {fin && ok && <span className="myc-spore" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
      <div className="myc-jars">
        <div className="myc-jar">
          <small>chrome.storage.local</small>
          <b>{stored}</b>
          <span>pages, written immediately</span>
        </div>
        <div className="myc-jar">
          <small>Moss index</small>
          <b>{stored}</b>
          <span>upserted{updated ? ` · ${updated} updated in place` : ""}</span>
        </div>
        <button type="button" className="myc-ghost" onClick={play}>
          Replay
        </button>
      </div>
    </div>
  );
}
