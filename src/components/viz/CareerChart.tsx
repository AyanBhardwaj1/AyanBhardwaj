import { careerSeries, formatMonth } from "@/lib/career";
import { CareerChartIsland, type ChartPoint } from "./CareerChartIsland";

const W = 960;
const H = 320;
const PAD = { l: 8, r: 56, t: 24, b: 32 };

/** GP <GO>: the AYAN index. Geometry computed at build; the island adds the crosshair. */
export function CareerChart() {
  const { points, min, max } = careerSeries();
  const lo = Math.floor(min / 10) * 10;
  const hi = Math.ceil(max / 10) * 10;
  const x = (i: number) =>
    PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) =>
    PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);

  const chartPoints: ChartPoint[] = points.map((p, i) => ({
    x: Math.round(x(i) * 10) / 10,
    y: Math.round(y(p.value) * 10) / 10,
    month: formatMonth(p.month),
    value: p.value,
    event: p.event
      ? {
          ticker: p.event.ticker,
          title: p.event.title,
          detail: p.event.detail,
          kind: p.event.kind,
        }
      : undefined,
  }));
  const gridValues = Array.from(
    { length: 5 },
    (_, i) => lo + ((hi - lo) / 4) * i,
  );
  const first = points[0].value;
  const last = points.at(-1)!.value;
  const change = ((last - first) / first) * 100;
  const years = [...new Set(points.map((p) => p.month.slice(0, 4)))];

  return (
    <div id="career" className="card mt-20 overflow-hidden md:mt-28">
      <div className="t-data border-line flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <span className="text-accent">AYAN</span>
          <span className="text-muted">Index · GP</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{last.toFixed(1)}</span>
          <span className="text-up">▲ +{change.toFixed(1)}%</span>
          <span className="text-muted">MAX</span>
        </div>
      </div>
      <CareerChartIsland
        points={chartPoints}
        width={W}
        height={H}
        grid={gridValues.map((v) => ({
          y: Math.round(y(v) * 10) / 10,
          label: v.toFixed(0),
        }))}
        years={years.map((yr) => {
          const i = points.findIndex((p) => p.month.startsWith(yr));
          return { x: Math.round(x(i) * 10) / 10, label: yr };
        })}
        padRight={PAD.r}
      />
      <p className="t-label border-line text-muted border-t px-4 py-3 md:px-6">
        AYAN index · illustrative, not a real metric · flags mark real events
      </p>
      <ol className="sr-only">
        {points
          .filter((p) => p.event)
          .map((p) => (
            <li key={p.month}>
              {formatMonth(p.month)}: {p.event!.title}. {p.event!.detail}
            </li>
          ))}
      </ol>
    </div>
  );
}
