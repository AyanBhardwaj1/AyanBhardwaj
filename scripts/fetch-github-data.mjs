#!/usr/bin/env node
// Regenerates GitHub data for Ayan Bhardwaj's portfolio site.
//
//   node docs/research/fetch-github-data.mjs [outDir]
//
// Node 22+, no dependencies. Set GITHUB_TOKEN (any read-only token, no scopes
// needed) to lift the 60 req/hr unauthenticated limit; recommended in CI.
// Writes, by default into ./data next to this script:
//   github-profile.json      profile + public repos + language bytes
//   contributions.json       daily contribution counts (last ~2 years)
//   oss-contributions.json   PRs/commits authored in repos he does not own
//
// A failure in one section never wipes a previously good file: each file is
// only written when its section succeeds.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const USER = process.env.GH_USER || "AyanBhardwaj1";
const OUT = resolve(
  process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), "data"),
);
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
// Repos that are coursework/placeholders; skipped for language-byte lookups
// (saves rate limit). They still appear in the repo list.
const SKIP_LANG = new Set(["AyanBhardwaj", "mywebsite", "Prog2-Random-Writer"]);

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": `${USER}-portfolio-data`,
  "X-GitHub-Api-Version": "2022-11-28",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function gh(path) {
  const url = path.startsWith("http") ? path : `https://api.github.com${path}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const left = res.headers.get("x-ratelimit-remaining");
    throw new Error(
      `${res.status} ${res.statusText} for ${url} (rate limit remaining: ${left})`,
    );
  }
  return res.json();
}

async function ghPaged(path) {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const batch = await gh(`${path}${sep}per_page=100&page=${page}`);
    const items = Array.isArray(batch) ? batch : batch.items || [];
    all.push(...items);
    if (items.length < 100) break;
  }
  return all;
}

const save = async (name, data) => {
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, name), JSON.stringify(data, null, 2) + "\n");
  console.log(`wrote ${join(OUT, name)}`);
};

// ---------- 1. profile + repos ----------
async function profile() {
  const u = await gh(`/users/${USER}`);
  const raw = await ghPaged(`/users/${USER}/repos?type=owner&sort=pushed`);
  const repos = raw.map((r) => ({
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    url: r.html_url,
    homepage: r.homepage || null,
    stars: r.stargazers_count,
    forks: r.forks_count,
    watchers: r.watchers_count,
    language: r.language,
    topics: r.topics || [],
    fork: r.fork,
    archived: r.archived,
    default_branch: r.default_branch,
    size_kb: r.size,
    license: r.license?.spdx_id || null,
    created_at: r.created_at,
    pushed_at: r.pushed_at,
    updated_at: r.updated_at,
    social_preview: `https://opengraph.githubassets.com/1/${r.full_name}`,
  }));
  for (const r of repos) {
    if (r.fork || SKIP_LANG.has(r.name)) continue;
    try {
      r.languages = await gh(`/repos/${r.full_name}/languages`);
    } catch (e) {
      console.warn(`languages skipped for ${r.name}: ${e.message}`);
    }
  }
  const own = repos.filter((r) => !r.fork);
  const langTotals = {};
  for (const r of own)
    for (const [k, v] of Object.entries(r.languages || {}))
      langTotals[k] = (langTotals[k] || 0) + v;
  await save("github-profile.json", {
    generated_at: new Date().toISOString(),
    profile: {
      login: u.login,
      name: u.name,
      bio: u.bio,
      company: u.company,
      location: u.location,
      blog: u.blog || null,
      twitter_username: u.twitter_username,
      avatar_url: u.avatar_url,
      avatar_url_large: `${u.avatar_url.split("?")[0]}?s=460&v=4`,
      html_url: u.html_url,
      public_repos: u.public_repos,
      followers: u.followers,
      following: u.following,
      created_at: u.created_at,
    },
    stats: {
      repo_count: repos.length,
      own_repo_count: own.length,
      total_stars_own: own.reduce((s, r) => s + r.stars, 0),
      total_forks_own: own.reduce((s, r) => s + r.forks, 0),
      language_bytes_total: Object.fromEntries(
        Object.entries(langTotals).sort((a, b) => b[1] - a[1]),
      ),
    },
    repos,
  });
}

// ---------- 2. contribution calendar ----------
// Primary: GitHub's own calendar fragment (HTML). Fallback: jogruber proxy.
async function calendarFromGitHub(query = "") {
  const res = await fetch(
    `https://github.com/users/${USER}/contributions${query}`,
    {
      headers: {
        "User-Agent": headers["User-Agent"],
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  if (!res.ok) throw new Error(`calendar ${res.status}`);
  const html = await res.text();
  const cells = new Map();
  for (const m of html.matchAll(
    /<td[^>]*?data-date="(\d{4}-\d{2}-\d{2})"[^>]*?id="([^"]+)"[^>]*?data-level="(\d)"/g,
  ))
    cells.set(m[2], { date: m[1], level: +m[3], count: 0 });
  for (const m of html.matchAll(
    /<tool-tip[^>]*?for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g,
  )) {
    const c = cells.get(m[1]);
    const n = m[2].match(/^([\d,]+) contribution/);
    if (c && n) c.count = +n[1].replace(/,/g, "");
  }
  const total = html.match(
    /([\d,]+)\s+contributions?\s+in\s+(?:the last year|\d{4})/,
  );
  if (!cells.size)
    throw new Error("calendar: no day cells parsed (markup changed?)");
  return {
    days: [...cells.values()],
    total: total ? +total[1].replace(/,/g, "") : null,
  };
}

async function contributions() {
  let days, source, lastYearTotal;
  try {
    const cur = await calendarFromGitHub();
    const first = cur.days.map((d) => d.date).sort()[0];
    // The fragment takes ?from=&to= but returns whole calendar years, so pull
    // the two calendar years before the rolling window and trim to ~2 years.
    const cutoff = new Date(new Date(first).getTime() - 366 * 86400000)
      .toISOString()
      .slice(0, 10);
    const y = +first.slice(0, 4);
    const older = [];
    for (const year of [y, y - 1]) {
      try {
        older.push(
          ...(await calendarFromGitHub(`?from=${year}-01-01&to=${year}-12-31`))
            .days,
        );
      } catch (e) {
        console.warn(`calendar year ${year} skipped: ${e.message}`);
      }
    }
    const byDate = new Map(
      [...older.filter((d) => d.date >= cutoff), ...cur.days].map((d) => [
        d.date,
        d,
      ]),
    );
    days = [...byDate.values()];
    lastYearTotal = cur.total ?? cur.days.reduce((s, d) => s + d.count, 0);
    source = "github.com/users/{user}/contributions";
  } catch (e) {
    console.warn(
      `GitHub calendar failed (${e.message}); falling back to jogruber proxy`,
    );
    const j = await (
      await fetch(
        `https://github-contributions-api.jogruber.de/v4/${USER}?y=all`,
      )
    ).json();
    const cutoff = new Date(Date.now() - 2 * 366 * 86400000)
      .toISOString()
      .slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    days = j.contributions.filter((d) => d.date >= cutoff && d.date <= today);
    const yearAgo = new Date(Date.now() - 365 * 86400000)
      .toISOString()
      .slice(0, 10);
    lastYearTotal = days
      .filter((d) => d.date > yearAgo)
      .reduce((s, d) => s + d.count, 0);
    source = "github-contributions-api.jogruber.de";
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  days = days.map(({ date, count, level }) => ({ date, count, level }));
  const total = days.reduce((s, d) => s + d.count, 0);
  // streaks + busiest day, handy for the site
  let longest = 0,
    run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else if (i === days.length - 1)
      continue; // today may still be empty
    else break;
  }
  const busiest = days.reduce((a, b) => (b.count > a.count ? b : a), days[0]);
  await save("contributions.json", {
    generated_at: new Date().toISOString(),
    source,
    user: USER,
    range: { from: days[0]?.date, to: days.at(-1)?.date },
    total,
    total_last_year: lastYearTotal,
    active_days: days.filter((d) => d.count > 0).length,
    longest_streak_days: longest,
    current_streak_days: current,
    busiest_day: busiest,
    days,
  });
}

// ---------- 3. open-source contributions (outside his own repos) ----------
async function oss() {
  const prs = await ghPaged(
    `/search/issues?q=${encodeURIComponent(`author:${USER} type:pr`)}&sort=created&order=desc`,
  );
  const mapped = prs.map((p) => {
    const repo = p.repository_url.replace("https://api.github.com/repos/", "");
    return {
      repo,
      number: p.number,
      title: p.title,
      url: p.html_url,
      state: p.state,
      merged: Boolean(p.pull_request?.merged_at),
      merged_at: p.pull_request?.merged_at || null,
      draft: p.draft || false,
      created_at: p.created_at,
      closed_at: p.closed_at,
      external: !repo.toLowerCase().startsWith(`${USER.toLowerCase()}/`),
      labels: (p.labels || []).map((l) => l.name),
    };
  });
  let commits = [];
  try {
    // Commit search can't negate user:, so fetch his commits and drop his own repos.
    const c = await ghPaged(
      `/search/commits?q=${encodeURIComponent(`author:${USER}`)}&sort=author-date&order=desc`,
    );
    commits = c
      .filter(
        (x) =>
          !x.repository.full_name
            .toLowerCase()
            .startsWith(`${USER.toLowerCase()}/`),
      )
      .map((x) => ({
        repo: x.repository.full_name,
        sha: x.sha.slice(0, 7),
        message: x.commit.message.split("\n")[0],
        url: x.html_url,
        date: x.commit.author?.date,
      }));
  } catch (e) {
    console.warn(`commit search skipped: ${e.message}`);
  }
  const external = mapped.filter((p) => p.external);
  const byRepo = {};
  for (const p of external) {
    byRepo[p.repo] ??= { total: 0, merged: 0, open: 0, closed_unmerged: 0 };
    const b = byRepo[p.repo];
    b.total++;
    if (p.merged) b.merged++;
    else if (p.state === "open") b.open++;
    else b.closed_unmerged++;
  }
  await save("oss-contributions.json", {
    generated_at: new Date().toISOString(),
    user: USER,
    summary: {
      external_prs: external.length,
      external_merged: external.filter((p) => p.merged).length,
      by_repo: byRepo,
    },
    external_prs: external,
    own_repo_prs: mapped.filter((p) => !p.external),
    external_commits: commits,
  });
}

const results = await Promise.allSettled([profile(), contributions(), oss()]);
let failed = 0;
for (const [i, r] of results.entries()) {
  if (r.status === "rejected") {
    failed++;
    console.error(
      `[${["profile", "contributions", "oss"][i]}] ${r.reason?.message || r.reason}`,
    );
  }
}
process.exit(failed ? 1 : 0);
