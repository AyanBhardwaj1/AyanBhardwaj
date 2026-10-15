"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { shortcutMode } from "@/lib/prefs";

/**
 * Always-loaded shell for the command palette (~1 KB): global shortcuts and
 * open state. The palette itself (cmdk + registry + search) is a separate
 * chunk, fetched on first intent.
 */

const loadPalette = () => import("./CommandPalette");
const CommandPalette = dynamic(loadPalette, { ssr: false });

type PaletteContext = {
  open: (prefill?: string) => void;
  close: () => void;
  prefetch: () => void;
  isOpen: boolean;
};

const Ctx = createContext<PaletteContext | null>(null);

export function usePalette() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePalette must be used inside PaletteProvider");
  return ctx;
}

const isTyping = (el: Element | null) =>
  !!el &&
  (el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    (el as HTMLElement).isContentEditable);

export function PaletteProvider({
  children,
  hasResume,
}: {
  children: React.ReactNode;
  hasResume: boolean;
}) {
  const [isOpen, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [prefill, setPrefill] = useState("");

  const open = useCallback((text = "") => {
    setPrefill(text);
    setMounted(true);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const prefetch = useCallback(() => {
    void loadPalette();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (!v) {
            setPrefill("");
            setMounted(true);
          }
          return !v;
        });
        return;
      }
      if (isOpen || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented)
        return;
      if (isTyping(document.activeElement)) return;
      const mode = shortcutMode();
      if (mode === "off") return;
      if (e.key === "/") {
        e.preventDefault();
        open();
      } else if (e.key === "?") {
        e.preventDefault();
        open("help");
      } else if (
        mode === "all" &&
        /^[a-zA-Z]$/.test(e.key) &&
        document.activeElement === document.body
      ) {
        // Bloomberg feel: start typing a mnemonic anywhere.
        e.preventDefault();
        open(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, open]);

  const value = useMemo(
    () => ({ open, close, prefetch, isOpen }),
    [open, close, prefetch, isOpen],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {mounted && (
        <CommandPalette
          open={isOpen}
          onOpenChange={setOpen}
          prefill={prefill}
          hasResume={hasResume}
        />
      )}
    </Ctx.Provider>
  );
}
