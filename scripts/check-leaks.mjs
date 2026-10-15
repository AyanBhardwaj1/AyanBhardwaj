#!/usr/bin/env node
// Fails if private or internal text reaches the source or the built output:
// editorial "confirm" notes, graduation year, GPA, phone number.
// Runs automatically after `npm run build` (postbuild) and in CI.
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const TARGETS = [
  "src",
  "public",
  "scripts",
  ".next/static",
  ".next/server/app",
];
const SKIP = new Set(["node_modules", ".git", "cache"]);
const EXT = /\.(m?[jt]sx?|json|css|html|txt|md|svg|xml|rsc|body)$/;
const RULES = [
  [/\bconfirm\??\s*:/, "editorial `confirm` field"],
  [/CONFIRM/, "CONFIRM note"],
  [/\b2029\b/, "graduation year"],
  [/\bGPA\b/i, "GPA"],
  [/\(945\)|945[-.\s]?527/, "phone number"],
  [/class of '?\d{2,4}/i, "class year"],
];
const SELF = "scripts/check-leaks.mjs";
// Owner-approved resume, published as-is at Ayan's request.
const ALLOW = new Set(["public/Ayan_Bhardwaj_Resume.pdf"]);

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (EXT.test(e.name)) yield p;
  }
}

const hits = [];
for (const t of TARGETS) {
  const dir = join(ROOT, t);
  if (!(await stat(dir).catch(() => null))) continue;
  for await (const file of walk(dir)) {
    const rel = relative(ROOT, file);
    if (rel === SELF || ALLOW.has(rel)) continue;
    const text = await readFile(file, "utf8");
    for (const [re, what] of RULES) {
      const m = text.match(re);
      if (m) {
        const at = text
          .slice(Math.max(0, m.index - 40), m.index + 40)
          .replace(/\s+/g, " ");
        hits.push(`${rel}: ${what} … ${at} …`);
      }
    }
  }
}

if (hits.length) {
  console.error(
    `check:leaks found ${hits.length} problem(s):\n` +
      hits.map((h) => `  - ${h}`).join("\n"),
  );
  process.exit(1);
}
console.log("check:leaks: clean");
