import { DEMO, FINDINGS } from "@/app/projects/runway/data";

/**
 * The page's what-if math, in the spirit of the product: plain arithmetic,
 * no model. runway = cash / (net burn - monthly savings); refunds add cash.
 * Days are counted at the average month length (365.25 / 12).
 */

const DAY = 86_400_000;
const MONTH_DAYS = 365.25 / 12;
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type RunwayState = {
  saved: number;
  refund: number;
  months: number;
  cashOut: number;
  daysGained: number;
  wasteLeft: number;
};

const runwayMonths = (saved: number, refund: number) =>
  (DEMO.cash + refund) / (DEMO.netBurn - saved);

const cashOutOf = (months: number) =>
  DEMO.asOf + Math.floor(months * MONTH_DAYS) * DAY;

const BASE_CASH_OUT = cashOutOf(runwayMonths(0, 0));
const TOTAL_WASTE = FINDINGS.reduce((s, f) => s + f.monthly, 0);

export function compute(fixed: ReadonlySet<string>): RunwayState {
  let saved = 0;
  let refund = 0;
  for (const f of FINDINGS) {
    if (!fixed.has(f.id)) continue;
    saved += f.monthly;
    refund += f.refund ?? 0;
  }
  const months = runwayMonths(saved, refund);
  const cashOut = cashOutOf(months);
  return {
    saved,
    refund,
    months,
    cashOut,
    daysGained: Math.round((cashOut - BASE_CASH_OUT) / DAY),
    wasteLeft: TOTAL_WASTE - saved,
  };
}

/** "NOV 03 2027" for the board. */
export function boardDate(t: number) {
  const d = new Date(t);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")} ${d.getUTCFullYear()}`;
}

/** "November 3, 2027" for prose and screen readers. */
export function longDate(t: number) {
  const d = new Date(t);
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** "Oct 2026" for the runway lights: `n` whole months after the snapshot. */
export function monthLabel(n: number) {
  const d = new Date(DEMO.asOf);
  const m = d.getUTCMonth() + n;
  const name = MONTHS_LONG[((m % 12) + 12) % 12].slice(0, 3);
  return `${name} ${d.getUTCFullYear() + Math.floor(m / 12)}`;
}

export const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
