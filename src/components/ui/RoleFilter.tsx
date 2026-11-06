"use client";

import { useEffect, useState } from "react";
import { ROLES, type RoleId } from "@/lib/roles";

/**
 * "What are you hiring for?": highlights the projects that match a role and
 * dims the rest, in place (no reshuffle, nothing hidden from screen readers,
 * which get the match count instead). Matching uses data-roles on each card.
 */
export function RoleFilter({ scope }: { scope: string }) {
  const [role, setRole] = useState<RoleId | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const root = document.getElementById(scope);
    if (!root) return;
    if (role) root.setAttribute("data-role", role);
    else root.removeAttribute("data-role");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- counts DOM matches after the attribute changes
    setCount(
      role ? root.querySelectorAll(`[data-roles~="${role}"]`).length : null,
    );
  }, [role, scope]);

  return (
    <div className="mb-10 flex flex-wrap items-center gap-2 md:mb-14">
      <span className="t-label text-muted mr-1">What are you hiring for?</span>
      {ROLES.map((r) => (
        <button
          key={r.id}
          type="button"
          aria-pressed={role === r.id}
          onClick={() => setRole((cur) => (cur === r.id ? null : r.id))}
          className={`pill min-h-9 px-3.5 text-[12px] ${role === r.id ? "border-accent text-accent" : ""}`}
        >
          {r.label}
        </button>
      ))}
      {role && (
        <button
          type="button"
          onClick={() => setRole(null)}
          className="t-label text-muted hover:text-fg min-h-9 px-2"
        >
          Clear
        </button>
      )}
      <span className="t-label text-muted ml-auto" aria-live="polite">
        {count !== null
          ? `${count} ${count === 1 ? "project matches" : "projects match"}`
          : ""}
      </span>
    </div>
  );
}
