import { useSyncExternalStore } from "react";

/**
 * A tiny store that lets the palette demo tell the graph what it found, so a
 * search above lights the same pages in the mycelium below. Module scope is
 * fine: there is one palette and one graph on the page.
 */
export type PaletteFind = { q: string; ids: number[] } | null;

let current: PaletteFind = null;
const subs = new Set<() => void>();

export function publishFind(next: PaletteFind) {
  const same =
    next === current ||
    (next &&
      current &&
      next.q === current.q &&
      next.ids.length === current.ids.length &&
      next.ids.every((id, i) => id === current!.ids[i]));
  if (same) return;
  current = next;
  subs.forEach((f) => f());
}

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};

export const usePaletteFind = () =>
  useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
