"use client";

import { useSyncExternalStore } from "react";
import { nyseHolidays } from "@/content/nyse";

/** Shared 1s clock for the status bar and footer. Client-only; server snapshot is null. */
const listeners = new Set<() => void>();
let timer: number | undefined;
let now = 0;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (timer === undefined) {
    now = Date.now();
    timer = window.setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now || Date.now(),
    () => null,
  );
}

const ctFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export const formatAustin = (t: number) => `${ctFormat.format(t)} CT`;

const etParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hour12: false,
});

/** NYSE regular session: 09:30–16:00 ET (08:30–15:00 CT), weekdays, minus holidays. */
export function nyseOpen(t: number): boolean {
  const parts = etParts.formatToParts(t);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  if (["Sat", "Sun"].includes(get("weekday")) || nyseHolidays.includes(date))
    return false;
  const minutes = (Number(get("hour")) % 24) * 60 + Number(get("minute"));
  return minutes >= 570 && minutes < 960;
}
