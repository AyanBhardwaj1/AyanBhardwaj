"use client";

import { PaletteProvider } from "./palette/PaletteProvider";

export function Providers({
  children,
  hasResume,
}: {
  children: React.ReactNode;
  hasResume: boolean;
}) {
  return <PaletteProvider hasResume={hasResume}>{children}</PaletteProvider>;
}
