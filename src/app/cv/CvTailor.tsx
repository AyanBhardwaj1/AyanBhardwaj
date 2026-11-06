"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { ROLES, type RoleId } from "@/lib/roles";
import { TAILOR_EVENT } from "@/lib/fit-match";

/**
 * "Tailor for": the role lives in the URL (?for=fintech) and nowhere else,
 * so links, Back, sharing and ayan-bot's /cv?for= links all agree. The
 * project list really re-renders in the new order (DOM, tab and reading
 * order match what's on screen), and Print / save as PDF follows it.
 * Static page: both pieces read the URL inside <Suspense>, with fallbacks
 * that render the untailored markup.
 */

export function useCvRole(): RoleId | null {
  const f = useSearchParams().get("for");
  return ROLES.some((r) => r.id === f) ? (f as RoleId) : null;
}

/** Same-page URL change; Next keeps useSearchParams in sync with it. */
function setRole(role: RoleId | null) {
  const url = new URL(window.location.href);
  if (role) url.searchParams.set("for", role);
  else url.searchParams.delete("for");
  window.history.replaceState(null, "", url);
}

export function CvTailorPills({
  role,
  onPick,
}: {
  role: RoleId | null;
  onPick?: (r: RoleId) => void;
}) {
  const label = ROLES.find((r) => r.id === role)?.label;
  return (
    <div
      role="group"
      aria-label="Tailor the CV for a role"
      className="flex flex-wrap items-center gap-2"
    >
      <span className="t-label text-muted mr-1">Tailor for</span>
      {ROLES.map((r) => (
        <button
          key={r.id}
          type="button"
          aria-pressed={role === r.id}
          onClick={() => onPick?.(r.id)}
          className={`pill min-h-9 px-3 text-[12px] ${role === r.id ? "border-accent text-accent" : ""}`}
        >
          {r.label}
        </button>
      ))}
      <span className="sr-only" aria-live="polite">
        {label ? `CV tailored for ${label}: matching projects first.` : ""}
      </span>
    </div>
  );
}

export function CvTailor() {
  const role = useCvRole();

  // The Fit check can ask for a role too.
  useEffect(() => {
    const onTailor = (e: Event) => {
      const r = (e as CustomEvent<string>).detail;
      if (ROLES.some((x) => x.id === r)) setRole(r as RoleId);
    };
    window.addEventListener(TAILOR_EVENT, onTailor);
    return () => window.removeEventListener(TAILOR_EVENT, onTailor);
  }, []);

  return (
    <CvTailorPills role={role} onPick={(r) => setRole(role === r ? null : r)} />
  );
}

export type CvProject = {
  id: string;
  name: string;
  tagline: string;
  where: string;
  description: string;
  stack: string[];
  page: string | null;
  roles: RoleId[];
  /** Not in the default list; shown only when tailored for one of these. */
  extraFor: RoleId[] | null;
};

export function CvProjectList({
  items,
  role,
}: {
  items: CvProject[];
  role: RoleId | null;
}) {
  const base = items.filter((p) => !p.extraFor);
  const list = role
    ? [
        ...base.filter((p) => p.roles.includes(role)),
        ...items.filter((p) => p.extraFor?.includes(role)),
        ...base.filter((p) => !p.roles.includes(role)),
      ]
    : base;
  return (
    <>
      {list.map((p) => (
        <div key={p.id} className="cv-item">
          <div className="cv-itemHead">
            <h3>
              {p.page ? <Link href={p.page}>{p.name}</Link> : p.name}
              <span className="cv-sep"> · </span>
              <span className="cv-sub">{p.tagline}</span>
            </h3>
            <p className="cv-when">{p.where}</p>
          </div>
          <p className="cv-desc">{p.description}</p>
          <p className="cv-stack">{p.stack.slice(0, 6).join(" · ")}</p>
        </div>
      ))}
    </>
  );
}

export function CvProjects({ items }: { items: CvProject[] }) {
  return <CvProjectList items={items} role={useCvRole()} />;
}
