"use client";

import { useId, useState } from "react";

/** TL;DR / FULL bio length toggle (Lee Robinson-style). Both versions are server-rendered. */
export function BioToggle({
  short,
  full,
}: {
  short: React.ReactNode;
  full: React.ReactNode;
}) {
  const [mode, setMode] = useState<"short" | "full">("short");
  const id = useId();
  return (
    <div>
      <div
        role="group"
        aria-label="Bio length"
        className="t-label border-line-strong mb-6 inline-flex rounded-full border p-1"
      >
        {(["short", "full"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            aria-controls={id}
            onClick={() => setMode(m)}
            className={`min-h-9 rounded-full px-4 transition-colors ${mode === m ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
          >
            {m === "short" ? "TL;DR" : "Full"}
          </button>
        ))}
      </div>
      <div id={id}>
        <div key={mode} className="bio-swap">
          {mode === "short" ? short : full}
        </div>
      </div>
    </div>
  );
}
