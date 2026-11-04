"use client";

import { FINDINGS } from "@/app/projects/runway/data";
import { FlapText } from "./FlapText";
import { boardDate, longDate, usd } from "./math";
import { useRunway } from "./RunwayState";
import { s } from "./cls";

const money = (f: (typeof FINDINGS)[number]) =>
  f.refund ? `$${f.refund.toFixed(2)} back` : `${usd(f.monthly)}/mo`;

/** Six real findings as console switches; each one re-flaps the date. */
export function WasteConsole() {
  const r = useRunway();
  const all = r.fixed.size === FINDINGS.length;
  return (
    <div className={s.console}>
      <ul className={s.switches} aria-label="Findings to fix">
        {FINDINGS.map((f) => {
          const on = r.fixed.has(f.id);
          return (
            <li key={f.id}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => r.toggle(f.id)}
                className={s.switch}
                data-on={on ? "" : undefined}
              >
                <span className={s.switchTop}>
                  <span className={s.kind}>{f.kind}</span>
                  <span className={s.toggle} aria-hidden="true">
                    <span className={s.knob} />
                  </span>
                </span>
                <span className={s.switchTitle}>{f.title}</span>
                <span className={s.switchBody}>{f.evidence}</span>
                <span className={s.switchFoot}>
                  <span className={s.amount}>{money(f)}</span>
                  <span className={s.state} aria-hidden="true">
                    {on ? "Fixed" : "Still paying"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className={s.readout}>
        <p className={s.readLabel}>Cash runs out</p>
        <p className="m-0">
          <span className="sr-only">{longDate(r.cashOut)}</span>
          <FlapText
            text={boardDate(r.cashOut)}
            cells={11}
            tone={r.daysGained > 0 ? "cleared" : "ink"}
            className={s.flapWide}
          />
        </p>
        <dl className={s.readGrid}>
          <div>
            <dt>Runway</dt>
            <dd key={r.months.toFixed(1)} className={s.tick}>
              {r.months.toFixed(1)} months
            </dd>
          </div>
          <div>
            <dt>Saved</dt>
            <dd key={r.saved} className={s.tick}>
              {usd(r.saved)}/mo
            </dd>
          </div>
          <div>
            <dt>Gained</dt>
            <dd key={r.daysGained} className={s.tick}>
              {r.daysGained} {r.daysGained === 1 ? "day" : "days"}
            </dd>
          </div>
          <div>
            <dt>Refunds</dt>
            <dd key={r.refund} className={s.tick}>
              {r.refund ? `$${r.refund.toFixed(2)}` : "$0"}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          role="switch"
          aria-checked={all}
          onClick={() => r.setAll(all ? null : FINDINGS.map((f) => f.id))}
          className={s.master}
          data-on={all ? "" : undefined}
        >
          <span className={s.toggle} aria-hidden="true">
            <span className={s.knob} />
          </span>
          Fix all six
        </button>
        <p className={s.note}>
          Runway is cash divided by net burn minus what you stop paying. A
          refund adds to cash. Same numbers as the demo dashboard, worked out
          here in your browser.
        </p>
      </div>
    </div>
  );
}
