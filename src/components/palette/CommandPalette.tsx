"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { links, projects, ui } from "@/content/content";
import {
  commands as allCommands,
  easterEggMap,
  parseMnemonic,
  searchLocal,
  type Command as Cmd,
  type CommandGroup,
} from "@/lib/commands";
import { cycleShortcutMode, getTheme } from "@/lib/prefs";
import { switchTheme } from "@/components/ui/ThemeToggle";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill: string;
  hasResume: boolean;
};

type LogLine = { id: number; kind: "in" | "out" | "err"; text: string };

const GROUP_ORDER: CommandGroup[] = ["Go", "Projects", "Links", "Settings"];
const QUICK = ["PROJ", "EXP", "GP", "AWRD", "CV", "MAIL", "THEME", "HELP"];
const RECENTS_KEY = "palette:recents";

const readRecents = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
};
const pushRecent = (id: string) => {
  try {
    const next = [id, ...readRecents().filter((r) => r !== id)].slice(0, 5);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
};

function score(cmd: Cmd, q: string): number {
  const query = q.toLowerCase();
  const mn = parseMnemonic(q);
  if (cmd.mnemonic === mn) return 1000;
  if (cmd.mnemonic.startsWith(mn)) return 500 - cmd.mnemonic.length;
  const title = cmd.title.toLowerCase();
  if (title.startsWith(query)) return 300;
  if (title.includes(query)) return 200;
  if (cmd.keywords.some((k) => k.startsWith(query))) return 120;
  if (cmd.keywords.some((k) => k.includes(query))) return 80;
  if (cmd.hint.toLowerCase().includes(query)) return 40;
  return 0;
}

const HELP_LINES = [
  "type a function code and press Enter (<GO>). e.g. PROJ, GP, CV, YOUB",
  "or type words to search projects and experience, on-device",
  "↑ ↓ to move · Enter to run · Tab to complete · Esc to close",
  "shortcuts: ⌘K / Ctrl+K anywhere · / to open · KEYS <GO> for type-to-open",
  "easter eggs exist. try: whoami, latency, mavs, sudo hire ayan",
];

export default function CommandPalette({
  open,
  onOpenChange,
  prefill,
  hasResume,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logId = useRef(0);
  const router = useRouter();
  const [query, setQuery] = useState(prefill);
  const [log, setLog] = useState<LogLine[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  const commands = useMemo(
    () => allCommands.filter((c) => !c.requiresResume || hasResume),
    [hasResume],
  );

  // Sync the native <dialog> with React state.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Open-time state lives with the side effect that opens the dialog.
      setRecents(readRecents());
      setQuery(prefill === "help" ? "" : prefill);
      if (prefill === "help")
        print(HELP_LINES.map((t) => ({ kind: "out" as const, text: t })));
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, prefill]);

  function print(lines: Omit<LogLine, "id">[]) {
    setLog((prev) =>
      [...prev, ...lines.map((l) => ({ ...l, id: ++logId.current }))].slice(-8),
    );
  }

  const { grouped, search, egg, flatCount, elapsed } = useMemo(() => {
    const t0 = performance.now();
    const q = query.trim();
    const eggHit = easterEggMap.get(q.toLowerCase());
    let list: Cmd[];
    if (!q) {
      const rec = recents
        .map((id) => commands.find((c) => c.id === id))
        .filter(Boolean) as Cmd[];
      list = [...rec, ...commands.filter((c) => !rec.includes(c))];
    } else {
      list = commands
        .map((c) => ({ c, s: score(c, q) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.c);
    }
    const hits = q.length >= 3 ? searchLocal(q, 4) : [];
    const groups: { name: string; items: Cmd[] }[] = [];
    if (!q && recents.length) {
      groups.push({
        name: "Recent",
        items: list.slice(0, Math.min(recents.length, 5)),
      });
      list = list.slice(Math.min(recents.length, 5));
    }
    if (q) {
      // Keep relevance order but bucket by the best-scoring group first.
      const seen = new Map<string, Cmd[]>();
      for (const c of list) {
        if (!seen.has(c.group)) seen.set(c.group, []);
        seen.get(c.group)!.push(c);
      }
      for (const [name, items] of seen) groups.push({ name, items });
    } else {
      for (const g of GROUP_ORDER) {
        const items = list.filter((c) => c.group === g);
        if (items.length) groups.push({ name: g, items });
      }
    }
    const ms = performance.now() - t0;
    return {
      grouped: groups,
      search: hits,
      egg: eggHit,
      flatCount:
        groups.reduce((s, g) => s + g.items.length, 0) +
        hits.length +
        (eggHit ? 1 : 0),
      elapsed: ms,
    };
  }, [query, commands, recents]);

  const top = grouped[0]?.items[0];
  const mn = parseMnemonic(query);
  const ghost =
    query && top && top.mnemonic.startsWith(mn) && top.mnemonic !== mn
      ? top.mnemonic.slice(mn.length)
      : "";

  function close() {
    onOpenChange(false);
  }

  function scrollTo(id: string) {
    close();
    requestAnimationFrame(() => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (id === "top") {
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        history.replaceState(null, "", window.location.pathname);
        return;
      }
      const el = document.getElementById(id);
      if (!el) {
        router.push(`/#${id}`);
        return;
      }
      el.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
      history.replaceState(null, "", `#${id}`);
    });
  }

  async function run(cmd: Cmd) {
    pushRecent(cmd.id);
    const a = cmd.action;
    print([{ kind: "in", text: `${cmd.mnemonic} <GO>` }]);
    switch (a.type) {
      case "scroll":
        return scrollTo(a.id);
      case "route":
        close();
        return router.push(a.href);
      case "external":
        window.open(a.href, "_blank", "noopener,noreferrer");
        return print([
          { kind: "out", text: `opened ${a.href.replace(/^https?:\/\//, "")}` },
        ]);
      case "copy":
        try {
          await navigator.clipboard.writeText(a.value);
          return print([
            { kind: "out", text: `${a.value} copied. ${a.toast}` },
          ]);
        } catch {
          return print([
            {
              kind: "err",
              text: `couldn't reach the clipboard. it's ${a.value}`,
            },
          ]);
        }
      case "theme": {
        const label = getTheme() === "dark" ? "Pre-Market" : "After Hours";
        switchTheme();
        return print([{ kind: "out", text: `SESSION: ${label}` }]);
      }
      case "shortcuts": {
        const mode = cycleShortcutMode();
        const text = {
          default: "shortcuts: / and ? open the palette. ⌘K always works.",
          all: "shortcuts: type-to-open on. start typing a letter anywhere.",
          off: "shortcuts: single keys off. ⌘K / Ctrl+K still works.",
        }[mode];
        return print([{ kind: "out", text }]);
      }
      case "help":
        return print(
          HELP_LINES.map((text) => ({ kind: "out" as const, text })),
        );
    }
  }

  function runEgg() {
    if (!egg) return;
    print([{ kind: "in", text: egg.command }]);
    if (egg.action === "list-projects") {
      print([{ kind: "out", text: projects.map((p) => p.id).join("  ") }]);
    } else {
      print([{ kind: "out", text: egg.response }]);
      if (egg.action === "mailto")
        setTimeout(() => (window.location.href = links.email.href), 600);
    }
    setQuery("");
  }

  return (
    <dialog
      ref={dialogRef}
      data-theme="dark"
      aria-label="Command palette"
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
      className="palette m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/50 backdrop:backdrop-blur-[2px] sm:mx-auto sm:mt-[12vh] sm:h-auto sm:max-w-2xl sm:px-4"
    >
      <Command
        label="Command palette"
        shouldFilter={false}
        loop
        className="border-line-strong bg-card text-fg flex h-full flex-col overflow-hidden font-mono text-sm shadow-2xl sm:h-auto sm:rounded-2xl sm:border"
      >
        <div className="border-line-strong text-muted flex items-center justify-between border-b px-4 py-2 text-[0.6875rem] tracking-wider uppercase">
          <span>ayan://terminal · functions</span>
          <button
            type="button"
            onClick={close}
            className="hover:text-fg focus-visible:text-fg rounded px-1.5 py-0.5"
          >
            Esc<span className="sr-only"> to close</span>
          </button>
        </div>

        {log.length > 0 && (
          <div
            aria-live="polite"
            className="border-line-strong max-h-40 space-y-1 overflow-y-auto border-b px-4 py-3 text-[0.8125rem]"
          >
            {log.map((l) => (
              <p
                key={l.id}
                className={
                  l.kind === "in"
                    ? "text-muted"
                    : l.kind === "err"
                      ? "text-down"
                      : "text-fg"
                }
              >
                {l.kind === "in" ? (
                  <span className="text-accent">› </span>
                ) : null}
                {l.text}
              </p>
            ))}
          </div>
        )}

        <div className="relative flex items-center gap-2 px-4 py-3.5">
          <span aria-hidden="true" className="text-accent shrink-0 font-medium">
            AYAN &gt;
          </span>
          <div className="relative min-w-0 flex-1">
            <Command.Input
              ref={inputRef}
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Type a function or search…"
              aria-describedby="palette-hint"
              autoComplete="off"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === "Tab" && ghost) {
                  e.preventDefault();
                  setQuery(query + ghost);
                }
                if (e.key === "Enter" && egg) {
                  e.preventDefault();
                  runEgg();
                } else if (
                  e.key === "Enter" &&
                  query.trim() &&
                  flatCount === 0
                ) {
                  e.preventDefault();
                  print([
                    { kind: "in", text: query.trim() },
                    { kind: "err", text: ui.unknownCommand },
                  ]);
                  setQuery("");
                }
              }}
              className="text-fg caret-accent placeholder:text-muted w-full bg-transparent text-base outline-none sm:text-sm"
            />
            {ghost && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-base sm:text-sm"
              >
                <span className="invisible whitespace-pre">{query}</span>
                <span className="text-muted">{ghost}</span>
              </span>
            )}
          </div>
          <span
            aria-hidden="true"
            className="term-cursor bg-accent h-4 w-2 shrink-0"
          />
        </div>
        <p id="palette-hint" className="sr-only">
          Type a function code like PROJ and press Enter, or search. Use arrow
          keys to choose a result.
        </p>

        <div className="border-line-strong flex gap-1.5 overflow-x-auto border-t px-4 py-2 sm:hidden">
          {QUICK.filter((m) => commands.some((c) => c.mnemonic === m)).map(
            (m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  const cmd = commands.find((c) => c.mnemonic === m);
                  if (cmd) void run(cmd);
                }}
                className="border-line-strong text-fg min-h-11 shrink-0 rounded-md border px-3 text-xs"
              >
                {m}
              </button>
            ),
          )}
        </div>

        <Command.List className="border-line-strong min-h-0 flex-1 overflow-y-auto overscroll-contain border-t px-2 py-2 sm:max-h-[min(52vh,26rem)]">
          <Command.Empty className="text-muted px-3 py-6">
            NO SECURITY FOUND. Try <span className="text-accent">PROJ</span>,{" "}
            <span className="text-accent">GP</span>,{" "}
            <span className="text-accent">CV</span> or{" "}
            <span className="text-accent">HELP</span> &lt;GO&gt;
          </Command.Empty>

          {egg && (
            <Command.Group heading="Terminal">
              <Command.Item
                value={`egg:${egg.command}`}
                onSelect={runEgg}
                className={itemClass}
              >
                <span className="text-accent w-14 shrink-0">RUN</span>
                <span className="truncate">{egg.command}</span>
              </Command.Item>
            </Command.Group>
          )}

          {grouped.map((g) => (
            <Command.Group key={g.name} heading={g.name} className={groupClass}>
              {g.items.map((c) => (
                <Command.Item
                  key={`${g.name}:${c.id}`}
                  value={`${g.name}:${c.id}`}
                  onSelect={() => void run(c)}
                  className={itemClass}
                >
                  <span className="text-accent w-14 shrink-0">
                    {c.mnemonic}
                  </span>
                  <span className="text-fg shrink-0">{c.title}</span>
                  <span className="text-muted truncate">{c.hint}</span>
                </Command.Item>
              ))}
            </Command.Group>
          ))}

          {search.length > 0 && (
            <Command.Group heading="Search" className={groupClass}>
              {search.map(({ doc, snippet }) => (
                <Command.Item
                  key={doc.id}
                  value={`search:${doc.id}`}
                  onSelect={() => {
                    print([{ kind: "in", text: `search "${query.trim()}"` }]);
                    scrollTo(doc.target);
                  }}
                  className={`${itemClass} flex-col items-start gap-0.5`}
                >
                  <span className="text-fg">
                    {doc.title}{" "}
                    <span className="text-muted">· {doc.section}</span>
                  </span>
                  <span className="text-muted line-clamp-1 text-xs">
                    {snippet}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>

        <div className="border-line-strong text-muted flex items-center justify-between border-t px-4 py-2 text-[0.6875rem]">
          <span aria-live="polite">
            {flatCount} result{flatCount === 1 ? "" : "s"} ·{" "}
            {elapsed < 0.1 ? "<0.1" : elapsed.toFixed(1)} ms · on-device
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            ENTER &lt;GO&gt; · ESC CANCEL · ↑↓ NAVIGATE
          </span>
        </div>
      </Command>
    </dialog>
  );
}

const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:uppercase";
const itemClass =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 data-[selected=true]:bg-card-hover data-[selected=true]:outline data-[selected=true]:outline-1 data-[selected=true]:outline-accent/40 sm:min-h-0";
