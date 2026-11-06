"use client";

import { useState } from "react";
import { useCvRole } from "./CvTailor";
import { composeCv, type CvParts } from "@/lib/cv-compose";

/** Copies the CV as Markdown (rendered into the page, so no fetch is needed). */
export function CopyCv({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      setState("fail");
    }
    window.setTimeout(() => setState("idle"), 1800);
  };
  return (
    <>
      <button type="button" onClick={copy} className="pill min-h-10">
        {state === "done" ? "Copied" : "Copy as text"}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === "done"
          ? "CV copied to the clipboard as Markdown."
          : state === "fail"
            ? "Couldn't copy. The CV is also at /cv.md."
            : ""}
      </span>
    </>
  );
}

/** Copy as text for a role (assembled here from the parts). */
export function CopyCvTailored({
  parts,
  role,
}: {
  parts: CvParts;
  role: string | null;
}) {
  return <CopyCv text={composeCv(parts, role)} />;
}

/** Copy as text that follows the tailoring in the URL (?for=). */
export function CopyCvFromUrl({ parts }: { parts: CvParts }) {
  return <CopyCvTailored parts={parts} role={useCvRole()} />;
}
