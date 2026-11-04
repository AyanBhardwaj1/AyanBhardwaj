"use client";

import { useEffect, useRef, useState } from "react";
import { FINDINGS, TOWER_LOG } from "@/app/projects/runway/data";
import { usd } from "./math";
import { s } from "./cls";

const LINE_MS = 520;

/**
 * Autopilot's fixed pipeline replayed as a tower log, then the inbox where
 * each draft holds short until a person clears it. An illustrative replay:
 * clearing here changes nothing anywhere.
 */
export function TowerLog() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(TOWER_LOG.length);
  const [cleared, setCleared] = useState<ReadonlySet<string>>(() => new Set());
  const [live, setLive] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    let timer = 0;
    // Below the fold, so resetting to an empty log is never seen.
    const raf = window.setTimeout(() => setShown(0), 0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        let n = 0;
        timer = window.setInterval(() => {
          n += 1;
          setShown(n);
          if (n >= TOWER_LOG.length) window.clearInterval(timer);
        }, LINE_MS);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(raf);
      window.clearInterval(timer);
    };
  }, []);

  const done = shown >= TOWER_LOG.length;

  const clear = (id: string, title: string) => {
    setCleared((prev) => new Set(prev).add(id));
    setLive(
      `${title} cleared. In the product this is where a person approves it.`,
    );
  };

  return (
    <div ref={ref} className={s.tower}>
      <div className={s.log}>
        <p className={s.logHead}>
          <span>Autopilot · monthly review</span>
          <span>{done ? "complete" : "running"}</span>
        </p>
        <pre className={s.logBody} aria-label="Autopilot run log">
          <code>
            {TOWER_LOG.map((l, i) => (
              <span
                key={l.step}
                className={s.logLine}
                data-hidden={i >= shown ? "" : undefined}
              >
                <span className={s.logStep}>
                  {l.step.toUpperCase().padEnd(11)}
                </span>
                <span className={s.logOk}>ok</span> {l.note}
                {l.ms ? <span className={s.logMs}> {l.ms}</span> : null}
                {"\n"}
              </span>
            ))}
            <span className={s.logLine} data-hidden={done ? undefined : ""}>
              <span className={s.logStep}>{"HOLD".padEnd(11)}</span>
              awaiting a person for every draft{"\n"}
            </span>
          </code>
        </pre>
      </div>

      <div className={s.inbox}>
        <h3 className={s.inboxHead}>Inbox, by dollar impact</h3>
        <ul className={s.inboxList}>
          {FINDINGS.map((f) => {
            const ok = cleared.has(f.id);
            return (
              <li
                key={f.id}
                className={s.draft}
                data-cleared={ok ? "" : undefined}
              >
                <span className={s.draftMain}>
                  <span className={s.draftTitle}>{f.draft}</span>
                  <span className={s.draftMeta}>
                    {f.refund
                      ? `$${f.refund.toFixed(2)} back`
                      : `${usd(f.monthly)}/mo`}{" "}
                    · {ok ? "Cleared by you" : "Hold short: awaiting approval"}
                  </span>
                </span>
                <button
                  type="button"
                  className={s.clear}
                  onClick={() => clear(f.id, f.draft)}
                  disabled={ok}
                  aria-label={ok ? `${f.draft}: cleared` : `Clear: ${f.draft}`}
                >
                  {ok ? "Cleared" : "Clear"}
                </button>
              </li>
            );
          })}
        </ul>
        <p className={s.note}>
          A replay for this page. Clearing here sends nothing. In Runway a
          drafted email or ticket goes nowhere until a person approves it, and
          savings only count once the next bill confirms the charge stopped.
        </p>
        <p aria-live="polite" className="sr-only">
          {live}
        </p>
      </div>
    </div>
  );
}
