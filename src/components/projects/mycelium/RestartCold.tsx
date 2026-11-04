"use client";

import { COLD_EVENT } from "./Palette";

/** Drops the demo index and sends focus back to the hero palette. */
export function RestartCold() {
  return (
    <button
      type="button"
      className="myc-ghost"
      onClick={() => window.dispatchEvent(new Event(COLD_EVENT))}
    >
      Restart cold and search <span aria-hidden="true">↑</span>
    </button>
  );
}
