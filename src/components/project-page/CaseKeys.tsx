"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { shortcutMode } from "@/lib/prefs";

/**
 * [ and ] on a case study: previous / next case study (the footer's links,
 * from the keyboard). Same rules as j / k on the home page: off while
 * typing, with a dialog open, or when single-key shortcuts are off.
 */
export function CaseKeys({ prev, next }: { prev: string; next: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "[" && e.key !== "]") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement ||
          el.isContentEditable)
      )
        return;
      if (
        document.querySelector("dialog[open], [role=dialog][aria-modal=true]")
      )
        return;
      if (shortcutMode() !== "default") return;
      e.preventDefault();
      router.push(e.key === "]" ? next : prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prev, next]);
  return null;
}
