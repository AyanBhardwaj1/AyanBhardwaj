"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny client-side preference stores (theme, single-key shortcuts).
 * localStorage access is always wrapped: private mode or blocked storage
 * must never break the page.
 */

type Theme = "light" | "dark";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", l);
  window.addEventListener("storage", l);
  return () => {
    listeners.delete(l);
    mq.removeEventListener("change", l);
    window.removeEventListener("storage", l);
  };
};

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the in-memory DOM state still applies */
  }
};

export function getTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  write("theme", theme);
  emit();
}

export const toggleTheme = () =>
  setTheme(getTheme() === "dark" ? "light" : "dark");

export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribe, getTheme, () => null);
}

/**
 * Single-key shortcuts (WCAG 2.1.4: they can be turned off).
 *   "default": "/" and "?" open the palette; letters do nothing.
 *   "all":     also type-to-open (start typing a letter anywhere).
 *   "off":     only ⌘K / Ctrl+K.
 */
export type ShortcutMode = "default" | "all" | "off";

export function shortcutMode(): ShortcutMode {
  const v = read("shortcuts");
  return v === "all" || v === "off" ? v : "default";
}

export function cycleShortcutMode(): ShortcutMode {
  const order: ShortcutMode[] = ["default", "all", "off"];
  const next = order[(order.indexOf(shortcutMode()) + 1) % order.length];
  write("shortcuts", next);
  emit();
  return next;
}
