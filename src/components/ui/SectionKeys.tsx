"use client";

import { useEffect } from "react";
import { sections } from "@/content/extras";
import { shortcutMode } from "@/lib/prefs";

/**
 * j / k on the home page: next / previous section, like a terminal pager.
 * Moves keyboard focus to the section heading too, so screen readers follow.
 * Off when single-key shortcuts are off, or in type-to-open mode (where
 * letters open the palette), and never while typing or with a dialog open.
 */
const IDS = ["top", ...sections.map((s) => s.id)];

const typing = (el: Element | null) =>
  !!el &&
  (el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    (el as HTMLElement).isContentEditable);

export function SectionKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "j" && e.key !== "k") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      if (typing(document.activeElement)) return;
      if (
        document.querySelector("dialog[open], [role=dialog][aria-modal=true]")
      )
        return;
      if (shortcutMode() !== "default") return;

      const els = IDS.map((id) => document.getElementById(id)).filter(
        (x): x is HTMLElement => !!x,
      );
      // The section whose top is closest above the reading line.
      const line = window.scrollY + window.innerHeight * 0.3;
      let at = 0;
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top + window.scrollY <= line) at = i;
      });
      const to =
        e.key === "j" ? Math.min(els.length - 1, at + 1) : Math.max(0, at - 1);
      if (to === at && !(e.key === "k" && window.scrollY > 0)) return;
      e.preventDefault();
      const target = els[to];
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      target.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
      const heading = target.querySelector<HTMLElement>("h1, h2") ?? target;
      if (!heading.hasAttribute("tabindex"))
        heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
