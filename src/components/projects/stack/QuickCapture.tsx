"use client";

import { useId, useState } from "react";
import { capture, EXAMPLES } from "./parse";
import { s } from "./styles";

export function QuickCapture() {
  const [q, setQ] = useState(EXAMPLES[0]);
  const id = useId();
  const out = capture(q);

  return (
    <div className={s.capture} data-ui="">
      <label htmlFor={id} className={s.captureLabel}>
        Quick Capture <kbd>⌘⇧K</kbd>
      </label>
      <div className={s.captureBar}>
        <span aria-hidden="true" className={s.plus}>
          +
        </span>
        <input
          id={id}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="Type anything: a deadline, a flashcard, an application"
          aria-describedby={`${id}-out`}
        />
      </div>
      <ul className={s.examples} aria-label="Try an example">
        {EXAMPLES.map((e) => (
          <li key={e}>
            <button
              type="button"
              aria-pressed={q === e}
              onClick={() => setQ(e)}
            >
              {e}
            </button>
          </li>
        ))}
      </ul>
      <div id={`${id}-out`} aria-live="polite" className={s.captureOut}>
        {out ? (
          <>
            <p className={s.captureKind}>
              <span className={s.kindChip} data-kind={out.kind}>
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
          <p className={s.filed}>Type a line to see where it would be filed.</p>
        )}
      </div>
    </div>
  );
}
