"use client";

import { useEffect, useRef } from "react";
import { STYLES } from "./styleList";
import { s } from "./styles";

const KEY = "stack-page-style";

/**
 * Native radio inputs, so arrow keys and forms work for free. The re-skin is
 * pure CSS (`.st-root:has(input[value=x]:checked)`), so it works before and
 * without hydration; this component only remembers the choice and announces it.
 */
export function StyleSwitcher() {
  const live = useRef<HTMLParagraphElement>(null);
  const group = useRef<HTMLFieldSetElement>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    if (!saved) return;
    const input = group.current?.querySelector<HTMLInputElement>(
      `input[value="${CSS.escape(saved)}"]`,
    );
    if (!input) return;
    // Restore without the cross-fade, so a returning visitor sees no flash.
    const root = group.current?.closest<HTMLElement>(`.${s.root}`);
    root?.setAttribute("data-instant", "");
    input.checked = true;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => root?.removeAttribute("data-instant")),
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <fieldset ref={group} className={s.picker} data-ui="">
      <legend className={s.pickerLegend}>I study</legend>
      <div className={s.pickerRow}>
        {STYLES.map((st, i) => (
          <label key={st.id} className={s.pickerOpt}>
            <input
              type="radio"
              name="stack-style"
              value={st.id}
              defaultChecked={i === 0}
              onChange={() => {
                try {
                  localStorage.setItem(KEY, st.id);
                } catch {}
                if (live.current)
                  live.current.textContent = `Style: ${st.name}`;
              }}
            />
            <span>{st.major}</span>
          </label>
        ))}
      </div>
      <p ref={live} className="sr-only" aria-live="polite" />
    </fieldset>
  );
}
