"use client";

import { useState } from "react";

/** COPY → amber "COPIED ✓" for 1.6s, announced politely. Falls back to showing the address. */
export function CopyEmail({
  email,
  copiedText,
}: {
  email: string;
  copiedText: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(email);
            setState("copied");
          } catch {
            setState("failed");
          }
          window.setTimeout(() => setState("idle"), 1600);
        }}
        className={`pill min-h-10 ${state === "copied" ? "border-accent text-accent" : ""}`}
      >
        {state === "copied" ? "Copied ✓" : "[ Copy ]"}
      </button>
      <span aria-live="polite" className="sr-only">
        {state === "copied"
          ? copiedText
          : state === "failed"
            ? `Couldn't copy. The address is ${email}`
            : ""}
      </span>
    </>
  );
}
