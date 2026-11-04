"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LIMITS, type ChatMessage } from "@/lib/ayan-bot/guard";
import { Markdown } from "./Markdown";

/**
 * The ayan-bot chat panel (lazy chunk). A non-modal side panel on desktop and
 * a bottom sheet on mobile. Streams plain text from POST /api/ayan-bot.
 * The visible log isn't a live region (it would chatter on every token);
 * a separate polite region announces "thinking" and then the finished reply.
 */

type Msg = ChatMessage & {
  id: string;
  status?: "streaming" | "done" | "stopped" | "error";
};

const STARTERS = [
  "What did Ayan build at Moss?",
  "Show me his hackathon projects",
  "What's the CSB program?",
  "How do I contact him?",
];

const STORE_KEY = "ayan-bot:chat";

const readStore = (): Msg[] => {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    const v = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(v)
      ? v
          .filter(
            (m) =>
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              typeof m.id === "string",
          )
          .map((m) => ({
            ...m,
            status: m.status === "streaming" ? "stopped" : m.status,
          }))
      : [];
  } catch {
    return [];
  }
};

const writeStore = (msgs: Msg[]) => {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-24)));
  } catch {
    /* storage unavailable: chat just won't survive a reload */
  }
};

const plain = (md: string) =>
  md
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<GO>/g, "GO")
    .replace(/`/g, "");

// Random ids, so restored history, HMR and new messages can never collide.
let seq = 0;
const newId = () =>
  `${Date.now().toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function AyanBotPanel({
  open,
  onClose,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  pending: { text: string; id: number } | null;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const handled = useRef<number | null>(null);
  const titleId = useId();
  const counterId = useId();

  // Restore this tab's conversation once.
  useEffect(() => {
    const restored = readStore();
    if (restored.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from sessionStorage
      setMsgs(restored);
    }
  }, []);

  useEffect(() => {
    if (!busy) writeStore(msgs);
  }, [msgs, busy]);

  // Keep the newest line in view while streaming.
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom || !busy) el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  // Focus the input when the panel opens; Esc closes from anywhere.
  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // Leave Esc to the ⌘K palette when it's open on top.
      if (document.querySelector("dialog[open]")) return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // No abort-on-unmount: the panel stays mounted once opened, and React's
  // dev double-mount would otherwise cancel a prompt sent on first open.

  const patch = useCallback((id: string, fn: (m: Msg) => Msg) => {
    setMsgs((all) => all.map((m) => (m.id === id ? fn(m) : m)));
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, LIMITS.userChars);
      if (!text || busy) return;
      const user: Msg = { id: newId(), role: "user", content: text };
      const bot: Msg = {
        id: newId(),
        role: "assistant",
        content: "",
        status: "streaming",
      };
      const history = [...msgs, user]
        .filter((m) => m.status !== "error" && m.content)
        .slice(-LIMITS.historyMessages)
        .map(({ role, content }) => ({ role, content }));
      setMsgs((all) => [...all, user, bot]);
      setInput("");
      setBusy(true);
      setAnnounce("ayan-bot is thinking…");

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let acc = "";
      let finalStatus: Msg["status"] = "done";
      try {
        const res = await fetch("/api/ayan-bot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: ctrl.signal,
        });
        const resMode = res.headers.get("x-ayan-bot-mode");
        setMode(resMode);
        if (!res.ok || !res.body || resMode === "offline") {
          let message = "ayan-bot hit a snag. Try again in a moment.";
          try {
            const j = (await res.json()) as { message?: unknown };
            if (typeof j.message === "string") message = j.message;
          } catch {
            /* non-JSON error */
          }
          acc = message;
          finalStatus = "error";
          patch(bot.id, (m) => ({ ...m, content: acc }));
        } else {
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let pendingText = "";
          let raf = 0;
          const flush = () => {
            raf = 0;
            const snapshot = acc;
            patch(bot.id, (m) => ({ ...m, content: snapshot }));
          };
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            pendingText = dec.decode(value, { stream: true });
            acc += pendingText;
            // Batch token updates to one render per frame.
            if (!raf) raf = requestAnimationFrame(flush);
          }
          if (raf) cancelAnimationFrame(raf);
          acc += dec.decode();
          patch(bot.id, (m) => ({ ...m, content: acc }));
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          finalStatus = "stopped";
        } else {
          finalStatus = "error";
          if (!acc)
            acc =
              "Lost the connection to ayan-bot. Check your network and try again.";
        }
        patch(bot.id, (m) => ({ ...m, content: acc }));
      } finally {
        const status = finalStatus;
        patch(bot.id, (m) => ({ ...m, status }));
        setBusy(false);
        abortRef.current = null;
        setAnnounce(
          status === "stopped"
            ? "Reply stopped."
            : `ayan-bot says: ${plain(acc)}`,
        );
      }
    },
    [busy, msgs, patch],
  );

  // Prompts handed in by the launcher (e.g. from the ⌘K palette).
  useEffect(() => {
    if (!pending || handled.current === pending.id || busy) return;
    handled.current = pending.id;
    void send(pending.text);
  }, [pending, busy, send]);

  const stop = () => abortRef.current?.abort();

  const clear = () => {
    abortRef.current?.abort();
    setMsgs([]);
    writeStore([]);
    setAnnounce("Chat cleared.");
    inputRef.current?.focus();
  };

  const retry = () => {
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMsgs((all) => {
      const i = all.lastIndexOf(lastUser);
      return all.slice(0, i);
    });
    void send(lastUser.content);
  };

  const remaining = LIMITS.userChars - input.length;
  const lastBot = msgs.at(-1);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={`no-print border-line-strong bg-bg-elev fixed inset-x-0 bottom-0 z-[95] ${open ? "flex" : "hidden"} h-[min(85dvh,680px)] flex-col overflow-hidden rounded-t-[20px] border shadow-[0_-12px_48px_-12px_rgb(0_0_0/0.55)] md:inset-x-auto md:right-6 md:bottom-6 md:h-[min(640px,calc(100dvh-7rem))] md:w-[400px] md:rounded-[18px]`}
    >
      {/* Header: a terminal title bar */}
      <div className="border-line flex items-center gap-3 border-b px-4 py-3">
        <span aria-hidden="true" className="bg-accent size-2 rounded-full" />
        <h2
          id={titleId}
          className="font-mono text-[13px] font-medium tracking-tight"
        >
          ayan<span className="text-accent">-</span>bot
        </h2>
        {(mode === "live" || mode === "mock" || mode === "offline") && (
          <span className="text-muted border-line rounded-[4px] border px-1.5 py-px font-mono text-[10px] tracking-[0.12em] uppercase">
            {mode}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {msgs.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-muted hover:text-fg hover:bg-card min-h-9 rounded-[8px] px-2.5 font-mono text-[11px] tracking-wider uppercase transition-colors"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-fg hover:bg-card inline-flex size-9 items-center justify-center rounded-[8px] transition-colors"
          >
            <span className="sr-only">Close ayan-bot</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-4"
              fill="currentColor"
            >
              <path d="M4.2 3.1 8 6.9l3.8-3.8 1.1 1.1L9.1 8l3.8 3.8-1.1 1.1L8 9.1l-3.8 3.8-1.1-1.1L6.9 8 3.1 4.2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Log */}
      <div
        ref={logRef}
        role="log"
        aria-live="off"
        aria-busy={busy}
        aria-label="Conversation with ayan-bot"
        className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 text-[15px] leading-relaxed"
      >
        {msgs.length === 0 && (
          <div className="space-y-4">
            <p className="text-muted font-mono text-[11px] tracking-[0.14em] uppercase">
              AYAN &lt;GO&gt; · session open
            </p>
            <p>
              I&apos;m <strong className="font-semibold">ayan-bot</strong>. Ask
              me anything about Ayan: what he built at Moss, how YouBank works,
              the CSB program, or how to reach him. I stick to Ayan; everything
              else is off the tape.
            </p>
            <ul
              className="flex flex-wrap gap-2"
              aria-label="Suggested questions"
            >
              {STARTERS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => void send(s)}
                    className="border-line bg-card hover:border-accent/60 hover:bg-card-hover min-h-9 rounded-full border px-3.5 py-1.5 text-left text-[13px] transition-colors"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {msgs.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="bg-card border-line max-w-[85%] rounded-[14px] rounded-br-[4px] border px-3.5 py-2 break-words whitespace-pre-wrap">
                <span className="sr-only">You: </span>
                {m.content}
              </p>
            </div>
          ) : (
            <div key={m.id} className="max-w-full">
              <p
                aria-hidden="true"
                className={`mb-1.5 font-mono text-[10px] tracking-[0.14em] uppercase ${m.status === "error" ? "text-down" : "text-accent"}`}
              >
                ayan-bot ›{m.status === "stopped" && " stopped"}
                {m.status === "error" && " status"}
              </p>
              <span className="sr-only">ayan-bot: </span>
              <div
                className={`break-words ${m.status === "error" ? "text-muted" : ""}`}
              >
                <Markdown
                  text={m.content}
                  onNavigate={() => {
                    if (window.matchMedia("(max-width: 767px)").matches)
                      onClose();
                  }}
                  cursor={
                    m.status === "streaming" ? (
                      <span
                        aria-hidden="true"
                        className="term-cursor text-accent ml-0.5 inline-block motion-reduce:animate-none"
                      >
                        ▍
                      </span>
                    ) : null
                  }
                />
              </div>
              {m.status === "error" && m === lastBot && (
                <button
                  type="button"
                  onClick={retry}
                  className="text-accent mt-2 min-h-9 font-mono text-[11px] tracking-wider uppercase underline-offset-4 hover:underline"
                >
                  Retry
                </button>
              )}
            </div>
          ),
        )}
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </p>

      {/* Composer */}
      <form
        className="border-line border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <div className="border-line-strong bg-bg focus-within:border-accent/70 flex items-end gap-2 rounded-[12px] border py-1.5 pr-1.5 pl-3 transition-colors">
          <span
            aria-hidden="true"
            className="text-accent pb-1.5 font-mono text-[14px]"
          >
            &gt;
          </span>
          <label className="sr-only" htmlFor={`${counterId}-input`}>
            Ask ayan-bot about Ayan
          </label>
          <textarea
            id={`${counterId}-input`}
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={LIMITS.userChars}
            aria-describedby={counterId}
            placeholder="Ask about Ayan…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void send(input);
              }
            }}
            className="placeholder:text-dim [field-sizing:content] max-h-28 min-h-9 flex-1 resize-none bg-transparent py-1.5 font-mono text-[14px] leading-6 outline-none focus-visible:outline-none"
          />
          {busy ? (
            <button
              type="button"
              onClick={stop}
              className="border-line-strong hover:border-accent text-fg inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] border px-3 font-mono text-[11px] tracking-wider uppercase transition-colors"
            >
              <span
                aria-hidden="true"
                className="bg-accent size-2 rounded-[2px]"
              />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-accent inline-flex h-9 shrink-0 items-center rounded-[9px] px-3 font-mono text-[11px] font-medium tracking-wider text-[color:var(--on-accent)] uppercase transition-opacity disabled:opacity-40"
            >
              Send{" "}
              <span aria-hidden="true" className="ml-1">
                ↵
              </span>
            </button>
          )}
        </div>
        <p
          id={counterId}
          className="text-muted mt-1.5 flex justify-between px-1 font-mono text-[10px] tracking-wide"
        >
          <span>Answers only about Ayan · AI can be wrong</span>
          <span className={remaining < 60 ? "text-accent" : ""}>
            {remaining < 120 ? `${remaining} left` : ""}
          </span>
        </p>
      </form>
    </div>
  );
}
