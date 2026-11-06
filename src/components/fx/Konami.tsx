"use client";

import { useEffect } from "react";

const CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const typing = (el: Element | null) =>
  !!el &&
  (el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    (el as HTMLElement).isContentEditable);

/** ↑↑↓↓←→←→BA anywhere on the page: it starts raining tickers. */
export function Konami() {
  // A TOUR <GO> started on another page continues here.
  useEffect(() => {
    void import("./tour").then((m) => m.resumeTourIfPending());
  }, []);

  useEffect(() => {
    let at = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(document.activeElement))
        return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === CODE[at]) {
        at++;
        // The last two keys are letters; keep them from also opening the
        // palette in type-to-open mode (that listener checks defaultPrevented).
        if (at > 8) e.preventDefault();
        if (at === CODE.length) {
          at = 0;
          void import("./eggs").then((m) => m.rain());
        }
      } else if (key === "ArrowUp") at = at === 2 ? 2 : 1;
      else at = 0;
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
  return null;
}
