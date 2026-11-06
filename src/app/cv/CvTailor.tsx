"use client";

import { useEffect, useState } from "react";
import { ROLES, type RoleId } from "@/lib/roles";
import { TAILOR_EVENT } from "@/lib/fit-match";

/**
 * "Tailor for": moves the projects that fit a role to the top of the CV
 * (and adds a few more that fit it), with CSS order on data attributes, so
 * Print / save as PDF gets the tailored version too. The choice lives in
 * the URL (?for=fintech), so a tailored CV can be shared.
 */
export function CvTailor() {
  const [role, setRole] = useState<RoleId | null>(null);

  // Read ?for= once (the page is static, so only the browser knows it).
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("for");
    if (ROLES.some((r) => r.id === f))
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL
      setRole(f as RoleId);
    // The Fit check can ask for a role too.
    const onTailor = (e: Event) => {
      const r = (e as CustomEvent<string>).detail;
      if (ROLES.some((x) => x.id === r)) setRole(r as RoleId);
    };
    window.addEventListener(TAILOR_EVENT, onTailor);
    return () => window.removeEventListener(TAILOR_EVENT, onTailor);
  }, []);

  useEffect(() => {
    const cv = document.querySelector<HTMLElement>(".cv");
    if (!cv) return;
    if (role) cv.dataset.cvRole = role;
    else delete cv.dataset.cvRole;
    const url = new URL(window.location.href);
    if (role) url.searchParams.set("for", role);
    else url.searchParams.delete("for");
    if (url.href !== window.location.href)
      window.history.replaceState(window.history.state, "", url);
  }, [role]);

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
          data-tailor-pill={r.id}
          onClick={() => setRole((cur) => (cur === r.id ? null : r.id))}
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
