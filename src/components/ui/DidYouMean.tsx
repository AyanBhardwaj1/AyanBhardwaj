"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * On the 404 page: guess which real page a mistyped URL meant
 * (/projects/youbnk -> YouBank, /termnal -> Terminal) from the visitor's
 * own path. Static page, so this runs in the browser.
 */

export type Candidate = { href: string; label: string; keys: string[] };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function distance(a: string, b: string) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++)
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    prev = cur;
  }
  return prev[b.length];
}

export function guess(path: string, candidates: Candidate[]) {
  let segs: string[] = [];
  try {
    segs = decodeURIComponent(path).split("/").map(norm).filter(Boolean);
  } catch {
    segs = path.split("/").map(norm).filter(Boolean);
  }
  // "projects" alone carries no signal; the slug after it does.
  const words = segs.filter((w) => w !== "projects" && w !== "project");
  if (!words.length) return null;
  let best: { c: Candidate; d: number } | null = null;
  for (const c of candidates)
    for (const k of c.keys.map(norm))
      for (const w of words) {
        if (w.length < 3 || !k) continue;
        const d = k.includes(w) || w.includes(k) ? 0.5 : distance(w, k);
        const limit = Math.max(1, Math.floor(Math.max(w.length, k.length) / 3));
        if (d <= limit && (!best || d < best.d)) best = { c, d };
      }
  return best?.c ?? null;
}

export function DidYouMean({ candidates }: { candidates: Candidate[] }) {
  const [hit, setHit] = useState<Candidate | null>(null);
  useEffect(() => {
    // Read once on mount: the 404 is static, so the path is only known here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHit(guess(window.location.pathname, candidates));
  }, [candidates]);
  if (!hit) return null;
  return (
    <p className="t-data text-muted mt-3">
      did you mean{" "}
      <Link href={hit.href} className="link text-accent">
        {hit.label}
      </Link>
      ?
    </p>
  );
}
