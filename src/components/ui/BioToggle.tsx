"use client";

import { useId, useState } from "react";
import { SegToggle } from "../sections/mid/SegToggle";

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
      <div className="mb-6">
        <SegToggle
          label="Bio length"
          size="md"
          controls={id}
          options={[
            ["short", "TL;DR"],
            ["full", "Full"],
          ]}
          value={mode}
          onChange={(v) => setMode(v as "short" | "full")}
        />
      </div>
      <div id={id}>
        <div key={mode} className="bio-swap">
          {mode === "short" ? short : full}
        </div>
      </div>
    </div>
  );
}
