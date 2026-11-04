"use client";

import { DEMO } from "@/app/projects/runway/data";
import { FlapText } from "./FlapText";
import { boardDate, longDate, usd } from "./math";
import { useRunway } from "./RunwayState";
import { s } from "./cls";

const CELLS = 13;

/** The hero's split-flap board. Real text for readers; flaps are decoration. */
export function DepartureBoard() {
  const r = useRunway();
  const gained = r.daysGained > 0;
  const rows: {
    label: string;
    value: string;
    read: string;
    tone?: "ink" | "cleared" | "amber";
  }[] = [
    {
      label: "Flight",
      value: DEMO.company,
      read: `${DEMO.company}, the synthetic demo company`,
    },
    {
      label: "Runway",
      value: `${r.months.toFixed(1)} MO`,
      read: `${r.months.toFixed(1)} months`,
    },
    {
      label: "Cash out",
      value: boardDate(r.cashOut),
      read: longDate(r.cashOut),
      tone: gained ? "cleared" : "ink",
    },
    {
      label: "Waste",
      value: `${usd(r.wasteLeft)}/MO`,
      read: `${usd(r.wasteLeft)} a month`,
      tone: r.wasteLeft ? "amber" : "cleared",
    },
    {
      label: "Status",
      value: gained ? `+${r.daysGained} DAYS` : "ON TIME",
      read: gained
        ? `${r.daysGained} days gained by fixing waste`
        : "On time: no fixes applied",
      tone: gained ? "cleared" : "ink",
    },
  ];
  return (
    <div className={s.board}>
      <div className={s.boardHead} aria-hidden="true">
        <span>Departures</span>
      </div>
      <dl className={s.boardRows}>
        {rows.map((row, i) => (
          <div key={row.label} className={s.boardRow}>
            <dt className={s.boardLabel}>{row.label}</dt>
            <dd className="m-0">
              <span className="sr-only">{row.read}</span>
              <FlapText
                text={row.value}
                cells={CELLS}
                tone={row.tone}
                cascade={i}
              />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
