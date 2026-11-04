"use client";

import { createContext, useContext, useState } from "react";

/**
 * The band's three light sources, shared across the page's demos: pick
 * 850 nm in the hero and the spectrum and scope switch with it. Until the
 * visitor picks one, each demo shows its own default. Without the provider
 * each demo keeps its own state, so it still works on its own.
 */
export type Src = "850" | "660" | "white";
export const SOURCES: Src[] = ["850", "660", "white"];
export const LED_COLOR: Record<Src, string> = {
  "850": "#e0628a",
  "660": "#ff5a48",
  white: "#f4f4f4",
};
export const ledName = (s: Src) =>
  s === "850" ? "850 nm near-infrared" : s === "660" ? "660 nm red" : "white";

type Shared = { picked: Src | null; pick: (s: Src) => void };
const Ctx = createContext<Shared | null>(null);

export function LightSource({ children }: { children: React.ReactNode }) {
  const [picked, pick] = useState<Src | null>(null);
  return <Ctx value={{ picked, pick }}>{children}</Ctx>;
}

export function useLight(initial: Src): [Src, (s: Src) => void] {
  const shared = useContext(Ctx);
  const [local, setLocal] = useState<Src>(initial);
  if (!shared) return [local, setLocal];
  return [shared.picked ?? initial, shared.pick];
}

export function SourcePicker({
  value,
  onChange,
  label = "Light source",
}: {
  value: Src;
  onChange: (s: Src) => void;
  label?: string;
}) {
  return (
    <div className="os-seg" role="group" aria-label={label}>
      {SOURCES.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={value === s}
          onClick={() => onChange(s)}
        >
          <span
            className="os-led"
            style={{ background: LED_COLOR[s] }}
            aria-hidden="true"
          />
          {s === "white" ? "White" : `${s} nm`}
        </button>
      ))}
    </div>
  );
}
