import contributionsFile from "@/data/contributions.json";
import profileFile from "@/data/github-profile.json";
import ossFile from "@/data/oss-contributions.json";

/**
 * Everything here runs at build time against committed JSON snapshots
 * (regenerate with `npm run data:refresh`). No runtime network calls.
 */

export type ContributionDay = { date: string; count: number; level: number };

type Repo = {
  name: string;
  stars: number;
  fork: boolean;
  language: string | null;
  pushed_at: string;
};

const repos = profileFile.repos as Repo[];

export const buildYear = new Date(
  contributionsFile.generated_at,
).getUTCFullYear();
export const dataAsOf = contributionsFile.generated_at.slice(0, 10);

export function starsFor(repo?: string): number | undefined {
  if (!repo) return undefined;
  return repos.find((r) => r.name.toLowerCase() === repo.toLowerCase())?.stars;
}

export function totalStars(repoNames: string[]): number {
  return repoNames.reduce((sum, name) => sum + (starsFor(name) ?? 0), 0);
}

export const githubStats = {
  publicRepos: profileFile.profile.public_repos,
  ownStars: profileFile.stats.total_stars_own,
  followers: profileFile.profile.followers,
  externalPrs: ossFile.summary.external_prs,
  languages: Object.entries(
    profileFile.stats.language_bytes_total as Record<string, number>,
  )
    .filter(
      ([lang]) =>
        lang !== "Jupyter Notebook" && lang !== "HTML" && lang !== "CSS",
    )
    .slice(0, 5)
    .map(([lang]) => lang),
};

// ---------- Contribution calendar ----------

const allDays = (contributionsFile.days as ContributionDay[])
  .slice()
  .sort((a, b) => a.date.localeCompare(b.date));

const DAY_MS = 86_400_000;
const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

export type ContribRange = {
  key: string;
  label: string;
  /** weeks[w][weekday 0=Sun]; null = outside the range */
  weeks: (ContributionDay | null)[][];
  max: number;
  total: number;
  activeDays: number;
  bestStreak: number;
  currentStreak: number;
  busiest: ContributionDay;
  avgActive: number;
  weeklyStdev: number;
  busiestWeekday: string;
  monthTotals: { month: string; total: number }[];
  summary: string;
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const formatDay = (iso: string, withYear = true) =>
  toDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });

function buildRange(
  key: string,
  label: string,
  from: string,
  to: string,
): ContribRange {
  const days = allDays.filter((d) => d.date >= from && d.date <= to);
  const byDate = new Map(days.map((d) => [d.date, d]));
  const start = toDate(from);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // back to Sunday
  const end = toDate(to);

  const weeks: (ContributionDay | null)[][] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 7 * DAY_MS) {
    const week: (ContributionDay | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const iso = toIso(new Date(t + i * DAY_MS));
      week.push(
        iso < from || iso > to
          ? null
          : (byDate.get(iso) ?? { date: iso, count: 0, level: 0 }),
      );
    }
    weeks.push(week);
  }

  let best = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else if (i === days.length - 1) continue;
    else break;
  }

  const total = days.reduce((s, d) => s + d.count, 0);
  const active = days.filter((d) => d.count > 0);
  const busiest = days.reduce(
    (a, b) => (b.count > a.count ? b : a),
    days[0] ?? { date: from, count: 0, level: 0 },
  );
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  for (const d of days) weekdayTotals[toDate(d.date).getUTCDay()] += d.count;
  const weekTotals = weeks.map((w) =>
    w.reduce((s, d) => s + (d?.count ?? 0), 0),
  );
  const mean =
    weekTotals.reduce((s, v) => s + v, 0) / Math.max(weekTotals.length, 1);
  const stdev = Math.sqrt(
    weekTotals.reduce((s, v) => s + (v - mean) ** 2, 0) /
      Math.max(weekTotals.length, 1),
  );

  const months = new Map<string, number>();
  for (const d of days) {
    const m = toDate(d.date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    months.set(m, (months.get(m) ?? 0) + d.count);
  }

  return {
    key,
    label,
    weeks,
    max: Math.max(1, ...days.map((d) => d.count)),
    total,
    activeDays: active.length,
    bestStreak: best,
    currentStreak: current,
    busiest,
    avgActive: active.length ? total / active.length : 0,
    weeklyStdev: stdev,
    busiestWeekday: WEEKDAYS[weekdayTotals.indexOf(Math.max(...weekdayTotals))],
    monthTotals: [...months].map(([month, t]) => ({ month, total: t })),
    summary: `${total} public contributions from ${formatDay(from)} to ${formatDay(to)} across ${active.length} active days. Busiest day ${formatDay(busiest.date)} with ${busiest.count}.`,
  };
}

export function contributionRanges(): ContribRange[] {
  const to = allDays.at(-1)?.date ?? dataAsOf;
  const yearAgo = toDate(to);
  yearAgo.setUTCDate(yearAgo.getUTCDate() - 364);
  const ranges = [buildRange("last12m", "Last 12M", toIso(yearAgo), to)];
  const years = [...new Set(allDays.map((d) => d.date.slice(0, 4)))]
    .sort()
    .reverse();
  for (const y of years) {
    if (!allDays.some((d) => d.date.startsWith(y) && d.count > 0)) continue;
    ranges.push(
      buildRange(
        y,
        y,
        `${y}-01-01` < allDays[0].date ? allDays[0].date : `${y}-01-01`,
        `${y}-12-31` > to ? to : `${y}-12-31`,
      ),
    );
  }
  return ranges;
}
