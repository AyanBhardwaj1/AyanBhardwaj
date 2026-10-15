/**
 * SVG renderers for the contribution surface. Rendered on the server for the
 * initial HTML and re-rendered in the browser when the range/view changes,
 * from compact data (counts + levels), so the payload stays small.
 */

export type CompactRange = {
  key: string;
  label: string;
  /** ISO date of the Sunday that starts week 0 */
  start: string;
  /** [week][weekday] → count, or null when outside the range */
  counts: (number | null)[][];
  levels: number[][];
  max: number;
  summary: string;
  stats: [string, string][];
  monthly: { month: string; total: number }[];
};

// Oblique "skyline" projection: weeks run up-right, weekdays down-right, height is up.
const WX = 10;
const WY = -3;
const DX = 5;
const DY = 5;
const H = 72;
const r1 = (n: number) => Math.round(n * 10) / 10;
const pt = (p: { x: number; y: number }) => `${r1(p.x)},${r1(p.y)}`;
const iso = (w: number, d: number, h = 0) => ({
  x: w * WX + d * DX,
  y: w * WY + d * DY - h,
});

const DAY = 86_400_000;
export function dayLabel(start: string, w: number, d: number, count: number) {
  const date = new Date(Date.parse(`${start}T00:00:00Z`) + (w * 7 + d) * DAY);
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${label}: ${count} contribution${count === 1 ? "" : "s"}`;
}

export function IsoSkyline({ range }: { range: CompactRange }) {
  const W = range.counts.length;
  const minX = -4;
  const maxX = iso(W, 7).x + 4;
  const minY = iso(W, 0).y - H - 8;
  const maxY = iso(0, 7).y + 8;
  const logMax = Math.log1p(range.max);
  const floor = [iso(0, 0), iso(W, 0), iso(W, 7), iso(0, 7)].map(pt).join(" ");
  let grid = "";
  for (let w = 0; w <= W; w++) grid += `M${pt(iso(w, 0))}L${pt(iso(w, 7))}`;
  for (let d = 0; d <= 7; d++) grid += `M${pt(iso(0, d))}L${pt(iso(W, d))}`;

  const bars: {
    w: number;
    d: number;
    h: number;
    level: number;
    count: number;
  }[] = [];
  range.counts.forEach((week, w) =>
    week.forEach((c, d) => {
      if (!c) return;
      bars.push({
        w,
        d,
        count: c,
        h: Math.max(4, (Math.log1p(c) / logMax) * H),
        level: Math.max(1, range.levels[w][d]),
      });
    }),
  );
  // Painter's order: back rows (small d) first; within a row, far (large w) bars first.
  bars.sort((a, b) => a.d - b.d || b.w - a.w);

  return (
    <svg
      viewBox={`${r1(minX)} ${r1(minY)} ${r1(maxX - minX)} ${r1(maxY - minY)}`}
      className="h-auto w-full"
      role="img"
      aria-label={range.summary}
    >
      <polygon points={floor} fill="var(--heat-0)" />
      <path d={grid} stroke="var(--line)" strokeWidth="0.6" fill="none" />
      {bars.map((b) => {
        const top = [
          iso(b.w, b.d, b.h),
          iso(b.w + 1, b.d, b.h),
          iso(b.w + 1, b.d + 1, b.h),
          iso(b.w, b.d + 1, b.h),
        ];
        const front = [
          iso(b.w, b.d + 1, b.h),
          iso(b.w + 1, b.d + 1, b.h),
          iso(b.w + 1, b.d + 1),
          iso(b.w, b.d + 1),
        ];
        const side = [
          iso(b.w + 1, b.d, b.h),
          iso(b.w + 1, b.d + 1, b.h),
          iso(b.w + 1, b.d + 1),
          iso(b.w + 1, b.d),
        ];
        return (
          <g key={`${b.w}-${b.d}`}>
            <title>{dayLabel(range.start, b.w, b.d, b.count)}</title>
            <polygon
              className={`iso-right-${b.level}`}
              points={side.map(pt).join(" ")}
            />
            <polygon
              className={`iso-left-${b.level}`}
              points={front.map(pt).join(" ")}
            />
            <polygon
              className={`iso-top-${b.level}`}
              points={top.map(pt).join(" ")}
            />
          </g>
        );
      })}
    </svg>
  );
}

const CELL = 11;
const STEP = 14;

export function HeatGrid({ range }: { range: CompactRange }) {
  const W = range.counts.length;
  const startMs = Date.parse(`${range.start}T00:00:00Z`);
  const months: { x: number; label: string }[] = [];
  for (let w = 0; w < W; w++) {
    const firstOfMonthInWeek = [...Array(7).keys()].find(
      (i) => new Date(startMs + (w * 7 + i) * DAY).getUTCDate() === 1,
    );
    if (firstOfMonthInWeek !== undefined || w === 0) {
      const ref = new Date(startMs + (w * 7 + (firstOfMonthInWeek ?? 0)) * DAY);
      const x = w * STEP;
      if (!months.length || x - months.at(-1)!.x > 28)
        months.push({
          x,
          label: ref.toLocaleDateString("en-US", {
            month: "short",
            timeZone: "UTC",
          }),
        });
    }
  }
  return (
    <svg
      viewBox={`0 0 ${W * STEP} ${18 + 7 * STEP}`}
      width={W * STEP}
      height={18 + 7 * STEP}
      className="max-w-none"
      role="img"
      aria-label={range.summary}
    >
      {months.map((m) => (
        <text
          key={m.x}
          x={m.x}
          y="10"
          className="fill-[var(--fg-muted)] font-mono text-[10px]"
        >
          {m.label}
        </text>
      ))}
      {range.counts.map((week, w) =>
        week.map((c, d) =>
          c === null ? null : (
            <rect
              key={`${w}-${d}`}
              x={w * STEP}
              y={18 + d * STEP}
              width={CELL}
              height={CELL}
              rx="2"
              fill={`var(--heat-${range.levels[w][d]})`}
            >
              {c > 0 && <title>{dayLabel(range.start, w, d, c)}</title>}
            </rect>
          ),
        ),
      )}
    </svg>
  );
}

export function MonthlyBars({ monthly }: { monthly: CompactRange["monthly"] }) {
  const data = monthly.slice(-12);
  const max = Math.max(1, ...data.map((m) => m.total));
  return (
    <svg
      viewBox={`0 0 ${data.length * 14} 40`}
      className="h-10 w-full max-w-56"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {data.map((m, i) => {
        const h = Math.max(1.5, (m.total / max) * 38);
        return (
          <rect
            key={m.month}
            x={i * 14 + 2}
            y={40 - h}
            width="10"
            height={h}
            rx="1.5"
            fill="var(--accent)"
            opacity={0.35 + 0.65 * (m.total / max)}
          />
        );
      })}
    </svg>
  );
}
