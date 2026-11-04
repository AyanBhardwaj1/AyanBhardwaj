"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { compute, longDate, usd, type RunwayState } from "./math";

type Ctx = RunwayState & {
  fixed: ReadonlySet<string>;
  toggle: (id: string) => void;
  setAll: (ids: string[] | null) => void;
};

const RunwayCtx = createContext<Ctx | null>(null);

export function useRunway() {
  const c = use(RunwayCtx);
  if (!c) throw new Error("useRunway outside <RunwayProvider>");
  return c;
}

/**
 * Shared what-if state: the hero board and the waste console read the same
 * numbers. Screen readers hear one polite summary after changes settle,
 * never every flap.
 */
export function RunwayProvider({ children }: { children: React.ReactNode }) {
  const [fixed, setFixed] = useState<ReadonlySet<string>>(() => new Set());
  const state = useMemo(() => compute(fixed), [fixed]);
  const [announce, setAnnounce] = useState("");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      setAnnounce(
        `Cash runs out ${longDate(state.cashOut)}. Runway ${state.months.toFixed(1)} months, ${usd(state.saved)} a month saved.`,
      );
    }, 700);
    return () => window.clearTimeout(t);
  }, [state]);

  const toggle = useCallback((id: string) => {
    setFixed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAll = useCallback((ids: string[] | null) => {
    setFixed(new Set(ids ?? []));
  }, []);

  const value = useMemo(
    () => ({ ...state, fixed, toggle, setAll }),
    [state, fixed, toggle, setAll],
  );

  return (
    <RunwayCtx value={value}>
      {children}
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </RunwayCtx>
  );
}
