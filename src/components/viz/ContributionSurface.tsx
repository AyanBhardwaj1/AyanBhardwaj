import { contributionRanges, formatDay } from "@/lib/github";
import { ActivityIsland } from "./ActivityIsland";
import type { CompactRange } from "./contrib-svg";

/**
 * GH <GO>: "Commit Volatility Surface". Ranges and stats are derived at build
 * time from the committed snapshot; the island renders an isometric skyline
 * (log-scaled heights so one 35-commit day doesn't flatten the rest) or a flat
 * market-heatmap grid.
 */
export function ContributionSurface({
  languages,
}: {
  languages: { name: string; share: number }[];
}) {
  const ranges: CompactRange[] = contributionRanges().map((r) => ({
    key: r.key,
    label: r.label,
    start: r.weeks[0].find(Boolean)?.date ?? r.weeks[0][0]?.date ?? "",
    counts: r.weeks.map((w) => w.map((d) => (d ? d.count : null))),
    levels: r.weeks.map((w) => w.map((d) => d?.level ?? 0)),
    max: r.max,
    summary: r.summary,
    monthly: r.monthTotals,
    stats: [
      ["Total", r.total.toLocaleString("en-US")],
      [
        "High",
        `${r.busiest.count} (${formatDay(r.busiest.date, false).toUpperCase()})`,
      ],
      ["Active days", String(r.activeDays)],
      ["Streak", `${r.currentStreak}D (best ${r.bestStreak}D)`],
      ["Avg / active day", r.avgActive.toFixed(1)],
      ["σ / wk", r.weeklyStdev.toFixed(1)],
    ],
  }));
  // Week 0 may start before the range; anchor dates to that week's Sunday.
  for (const [i, r] of contributionRanges().entries()) {
    const firstIdx = r.weeks[0].findIndex(Boolean);
    const firstDay = r.weeks[0][firstIdx];
    if (firstDay) {
      const sunday = new Date(
        Date.parse(`${firstDay.date}T00:00:00Z`) - firstIdx * 86_400_000,
      );
      ranges[i].start = sunday.toISOString().slice(0, 10);
    }
  }

  return (
    <div className="card overflow-hidden">
      <ActivityIsland ranges={ranges} />
      <div className="border-line border-t px-4 py-5 md:px-6">
        <p className="t-label text-muted mb-3">
          Top languages · by bytes, own repos
        </p>
        <div
          className="flex h-1.5 overflow-hidden rounded-full bg-[var(--heat-0)]"
          aria-hidden="true"
        >
          {languages.map((l, i) => (
            <span
              key={l.name}
              style={{ width: `${l.share * 100}%`, opacity: 1 - i * 0.17 }}
              className="bg-accent h-full"
            />
          ))}
        </div>
        <ul className="t-data text-muted mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {languages.map((l, i) => (
            <li key={l.name} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="bg-accent size-2 rounded-[2px]"
                style={{ opacity: 1 - i * 0.17 }}
              />
              <span className="text-fg">{l.name}</span>{" "}
              {(l.share * 100).toFixed(l.share < 0.1 ? 1 : 0)}%
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
