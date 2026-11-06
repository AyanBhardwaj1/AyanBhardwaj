"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LIMITS, type ChatMessage } from "@/lib/ayan-bot/guard";
import { AUDIENCES, type Audience } from "@/lib/ayan-bot/audience";
import {
  FIT_HANDOFF_EVENT,
  FIT_HANDOFF_KEY,
  looksLikeJobDescription,
} from "@/lib/fit-match";
import { BriefMenu } from "./BriefMenu";
import { BRIEF_PROMPT, followUps, projectsIn, startersFor } from "./derive";
import { localAnswer } from "./local";
import { Markdown } from "./Markdown";
import {
  CopyButton,
  FollowUps,
  ListenButton,
  UsageMeter,
} from "./MessageExtras";
import { ProjectCards } from "./ProjectCards";
import "./panel.css";
import {
  currentPage,
  dropTicket,
  prefetchTicket,
  takeTicket,
  type Ticket,
} from "./ticket";

/**
 * The ayan-bot chat panel (lazy chunk). A non-modal side panel on desktop and
 * a bottom sheet on mobile. Streams plain text from POST /api/ayan-bot.
 * The visible log isn't a live region (it would chatter on every token);
 * a separate polite region announces "thinking" and then the finished reply.
 *
 * Motion: the panel slides/scales in with CSS transitions (bot.css); tokens
 * are released through a small typewriter buffer so bursty network chunks
 * read as steady typing; a three-dot indicator holds the place until the
 * first token. On phones the panel is a modal bottom sheet (focus trapped,
 * page scroll locked) sized to the visual viewport, so the keyboard never
 * covers the composer.
 *
 * Around each finished answer, everything is derived on the client from the
 * answer text and content.ts (derive.ts), so it costs no model tokens:
 * case-study cards, follow-up chips and a copy button. The starters follow
 * the page the panel opened on. When the visitor is out of messages (or the
 * live model is off), the suggested questions and the recruiter brief are
 * answered from saved briefs (local.ts) without calling the server.
 */

type Msg = ChatMessage & {
  id: string;
  status?: "streaming" | "done" | "stopped" | "error" | "offline";
  /** Answered from the saved briefs because the live model is offline. */
  saved?: boolean;
};

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

const MOBILE = "(max-width: 767px)";

/** Downloads the conversation as Markdown (generated in the browser). */
function saveTranscript(msgs: Msg[]) {
  const origin = window.location.origin;
  const lines = [
    `# ayan-bot chat`,
    ``,
    `From ${origin}, ${new Date().toLocaleString()}. ayan-bot answers only from Ayan Bhardwaj's site and can be wrong.`,
    ``,
  ];
  for (const m of msgs) {
    if (!m.content || m.status === "error") continue;
    // Site-relative links become absolute so they work outside the site.
    const text = m.content.replace(/\]\((\/[^)\s]*)\)/g, `](${origin}$1)`);
    lines.push(
      m.role === "user" ? `**You:** ${text}` : `**ayan-bot:** ${text}`,
      "",
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ayan-bot-chat.md";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const AUDIENCE_KEY = "ayan-bot:audience";

export default function AyanBotPanel({
  open,
  onClose,
  pending,
  onBrowse,
}: {
  open: boolean;
  onClose: () => void;
  pending: { text: string; id: number } | null;
  onBrowse?: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  // A pasted job description: offer the Fit check, which reads all of it
  // for free, instead of a 500-character question.
  const [jd, setJd] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Answer style the visitor picked; remembered on this device. */
  const [audience, setAudience] = useState<Audience | null>(null);
  const [announce, setAnnounce] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  /** Messages this visitor has left in the current window (null = unknown). */
  const [left, setLeft] = useState<number | null>(null);
  /** Minutes until the allowance refills, from the last 429's Retry-After. */
  const [retryMin, setRetryMin] = useState<number | null>(null);
  /** When the allowance should have refilled (ms epoch), after a 429. */
  const refillAt = useRef(0);
  const [mobile, setMobile] = useState(false);
  /** currentPage() key ("home", "functions" or a project slug). */
  const [page, setPage] = useState("home");
  const pathname = usePathname();
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const handled = useRef<number | null>(null);
  const titleId = useId();
  const counterId = useId();

  useEffect(() => {
    try {
      const a = localStorage.getItem(AUDIENCE_KEY);
      if (a === "recruiter" || a === "engineer")
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a saved preference
        setAudience(a);
    } catch {
      /* no storage */
    }
  }, []);
  const pickAudience = (a: Audience) => {
    const next = audience === a ? null : a;
    setAudience(next);
    try {
      if (next) localStorage.setItem(AUDIENCE_KEY, next);
      else localStorage.removeItem(AUDIENCE_KEY);
    } catch {
      /* fine: it just won't be remembered */
    }
  };

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

  // Which page the panel is on, for page-aware starters and cards.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads window.location after navigation
    setPage(currentPage());
  }, [pathname, open]);

  // Keep the newest line in view while streaming.
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom || !busy) el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  // Warm a solved ticket (and learn the visitor's allowance) when it opens.
  useEffect(() => {
    if (!open) return;
    let live = true;
    void prefetchTicket().then((t) => {
      if (!live || !t) return;
      if (t.remaining !== null) setLeft(t.remaining);
      if (t.mode) setMode(t.mode);
    });
    return () => {
      live = false;
    };
  }, [open]);

  // Focus the input when the panel opens; Esc closes from anywhere.
  useEffect(() => {
    if (!open) return;
    // Fine pointers get the composer focused; on touch that would raise the
    // keyboard over the starters, so wait for a tap.
    const t = requestAnimationFrame(() => {
      if (window.matchMedia("(pointer: fine)").matches)
        inputRef.current?.focus();
    });
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

  // Phones: modal sheet. Track the breakpoint, lock page scroll, trap Tab,
  // and size the sheet to the visual viewport (keyboard-aware).
  useEffect(() => {
    const m = window.matchMedia(MOBILE);
    const sync = () => setMobile(m.matches);
    sync();
    m.addEventListener("change", sync);
    return () => m.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open || !mobile) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const panel = panelRef.current;
    const vv = window.visualViewport;
    const fit = () => {
      if (!panel || !vv) return;
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      panel.style.setProperty("--ab-vh", `${vv.height}px`);
      panel.style.setProperty("--ab-kb", `${kb}px`);
      panel.toggleAttribute("data-kb", kb > 80);
    };
    fit();
    vv?.addEventListener("resize", fit);
    vv?.addEventListener("scroll", fit);
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panel) return;
      const items = [
        ...panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!panel.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      root.style.overflow = prev;
      vv?.removeEventListener("resize", fit);
      vv?.removeEventListener("scroll", fit);
      document.removeEventListener("keydown", trap);
      panel?.style.removeProperty("--ab-vh");
      panel?.style.removeProperty("--ab-kb");
      panel?.removeAttribute("data-kb");
    };
  }, [open, mobile]);

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
        .filter(
          (m) => m.status !== "error" && m.status !== "offline" && m.content,
        )
        .slice(-LIMITS.historyMessages)
        .map(({ role, content }) => ({ role, content }));
      setMsgs((all) => [...all, user, bot]);
      setInput("");
      setJd(null);
      setBusy(true);
      setAnnounce("ayan-bot is thinking…");
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      let acc = "";
      let shown = 0;
      let raf = 0;
      let drained: (() => void) | null = null;
      // Typewriter buffer: release a share of the backlog each frame, ending
      // on a word boundary, so chunky network arrivals read as steady typing.
      const tick = () => {
        raf = 0;
        const gap = acc.length - shown;
        if (gap > 0) {
          let next = shown + Math.max(2, Math.ceil(gap / 10));
          const space = acc.indexOf(" ", next);
          if (space !== -1 && space - next < 10) next = space + 1;
          shown = Math.min(acc.length, next);
          const snapshot = acc.slice(0, shown);
          patch(bot.id, (m) => ({ ...m, content: snapshot }));
        }
        if (shown < acc.length) raf = requestAnimationFrame(tick);
        else drained?.();
      };
      const push = () => {
        if (reduce) {
          shown = acc.length;
          const snapshot = acc;
          patch(bot.id, (m) => ({ ...m, content: snapshot }));
        } else if (!raf) raf = requestAnimationFrame(tick);
      };
      const drain = () =>
        shown >= acc.length
          ? Promise.resolve()
          : new Promise<void>((r) => {
              drained = r;
              if (!raf) raf = requestAnimationFrame(tick);
            });
      const flushNow = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        shown = acc.length;
        const snapshot = acc;
        patch(bot.id, (m) => ({ ...m, content: snapshot }));
      };
      let finalStatus: Msg["status"] = "done";
      const local = localAnswer(text);
      // A saved brief, typed out like a reply (no request, no tokens).
      const answerLocally = async () => {
        patch(bot.id, (m) => ({ ...m, saved: true }));
        acc = local ?? "";
        push();
        await drain();
      };
      try {
        // Out of messages and the window hasn't refilled yet: answer from the
        // saved briefs without a request. After the refill time, ask again.
        if (left === 0 && local && Date.now() < refillAt.current) {
          await answerLocally();
          return;
        }
        const post = (t: Ticket | null) =>
          fetch("/api/ayan-bot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: history,
              page: currentPage(),
              ...(audience ? { audience } : {}),
              ticket: t?.ticket ?? "",
              nonce: t?.nonce ?? "",
            }),
            signal: ctrl.signal,
          });
        let ticket = await takeTicket(ctrl.signal);
        // No ticket means the challenge endpoint refused or is down: treat
        // it as unavailable (saved brief if there is one) instead of sending
        // a request that can only come back "session expired".
        if (!ticket) {
          if (local) {
            await answerLocally();
            return;
          }
          acc =
            "ayan-bot can't take questions right now. Try again in a few minutes, or email Ayan at ayan.bhardwaj@utexas.edu.";
          finalStatus = "offline";
          flushNow();
          return;
        }
        let res = await post(ticket);
        // A stale or reused ticket: solve a fresh one and send once more.
        if (res.status === 401) {
          dropTicket();
          ticket = await takeTicket(ctrl.signal);
          res = await post(ticket);
        }
        const leftHeader = res.headers.get("x-ayan-bot-remaining");
        if (leftHeader !== null && /^\d+$/.test(leftHeader))
          setLeft(Number(leftHeader));
        const resMode = res.headers.get("x-ayan-bot-mode");
        setMode(resMode);
        if (res.status === 429) {
          const after = Number(res.headers.get("retry-after"));
          // Only a per-visitor limit says how many are left (header "0");
          // a site-wide limit shouldn't zero this visitor's meter.
          if (leftHeader === "0") setLeft(0);
          refillAt.current = Date.now() + (after > 0 ? after : 300) * 1000;
          setRetryMin(after > 0 ? Math.ceil(after / 60) : null);
        } else if (res.ok) setRetryMin(null);
        const isJson = (res.headers.get("content-type") ?? "").includes(
          "application/json",
        );
        const unavailable =
          res.status === 429 || res.status === 503 || resMode === "offline";
        if ((!res.ok || !res.body || isJson) && local && unavailable) {
          await answerLocally();
        } else if (!res.ok || !res.body || isJson) {
          let message = "ayan-bot hit a snag. Try again in a moment.";
          try {
            const j = (await res.json()) as { message?: unknown };
            if (typeof j.message === "string") message = j.message;
          } catch {
            /* non-JSON error */
          }
          acc = message;
          finalStatus = resMode === "offline" ? "offline" : "error";
          flushNow();
        } else {
          if (resMode === "offline")
            patch(bot.id, (m) => ({ ...m, saved: true }));
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            acc += dec.decode(value, { stream: true });
            push();
          }
          acc += dec.decode();
          push();
          await drain();
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
        flushNow();
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
    [busy, msgs, patch, left, audience],
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
  const offline = mode === "offline";
  const navigate = () => {
    if (window.matchMedia(MOBILE).matches) onClose();
  };

  const asked = new Set(
    msgs.filter((m) => m.role === "user").map((m) => m.content),
  );
  const starters = (label: string) => (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {startersFor(page)
        .filter((q) => !asked.has(q))
        .map((q, i) => (
          <li
            key={q}
            className="ab-starter"
            style={{ "--i": i } as React.CSSProperties}
          >
            <button
              type="button"
              disabled={busy}
              onClick={() => void send(q)}
              className="ab-chip border-line bg-card hover:border-accent/60 hover:bg-card-hover inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-left text-[13px] disabled:opacity-50"
            >
              {q}
              <span aria-hidden="true" className="ab-chip-go text-accent">
                →
              </span>
            </button>
          </li>
        ))}
    </ul>
  );

  return (
    <>
      <div
        aria-hidden="true"
        data-open={open ? "" : undefined}
        onClick={onClose}
        className="ab-scrim no-print"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={mobile && open ? "true" : "false"}
        aria-labelledby={titleId}
        data-open={open ? "" : undefined}
        className="ab-panel no-print border-line-strong bg-bg-elev fixed inset-x-0 bottom-0 z-[95] flex h-[min(85dvh,680px)] flex-col overflow-hidden rounded-t-[20px] border shadow-[0_-12px_48px_-12px_rgb(0_0_0/0.55)] md:inset-x-auto md:right-6 md:bottom-6 md:h-[min(640px,calc(100dvh-7rem))] md:w-[400px] md:rounded-[18px]"
      >
        {/* Grab handle (phones): a visual cue that this is a sheet. */}
        <span
          aria-hidden="true"
          className="bg-line-strong mx-auto mt-2 block h-1 w-9 shrink-0 rounded-full md:hidden"
        />
        {/* Header: a terminal title bar */}
        <div className="border-line flex items-center gap-3 border-b px-4 py-3">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${offline ? "bg-muted" : "bg-accent"}`}
          />
          <h2
            id={titleId}
            className="font-mono text-[13px] font-medium tracking-tight"
          >
            ayan<span className="text-accent">-</span>bot
          </h2>
          {(mode === "live" || mode === "mock" || offline) && (
            <span className="text-muted border-line rounded-[4px] border px-1.5 py-px font-mono text-[10px] tracking-[0.12em] uppercase">
              {offline ? "saved answers" : mode}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <BriefMenu disabled={busy} onPick={(q) => void send(q)} />
            {msgs.some((m) => m.role === "assistant" && m.content) && (
              <button
                type="button"
                onClick={() => saveTranscript(msgs)}
                disabled={busy}
                className="text-muted hover:text-fg hover:bg-card min-h-9 rounded-[8px] px-2.5 font-mono text-[11px] tracking-wider uppercase transition-colors disabled:opacity-40"
              >
                Save
                <span className="sr-only"> this chat as a Markdown file</span>
              </button>
            )}
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
              aria-keyshortcuts="Escape"
              className="text-muted hover:text-fg hover:bg-card inline-flex size-10 items-center justify-center rounded-[8px] transition-colors"
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
              <p className="ab-starter text-muted font-mono text-[11px] tracking-[0.14em] uppercase">
                AYAN &lt;GO&gt; · session open
              </p>
              <p
                className="ab-starter"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                I&apos;m <strong className="font-semibold">ayan-bot</strong>.
                Ask me anything about Ayan: what he built at Moss, how YouBank
                works, the CSB program, or how to reach him. I stick to Ayan;
                everything else is off the tape.
              </p>
              {starters("Suggested questions")}
              <p
                className="ab-starter text-muted text-[13px]"
                style={{ "--i": 6 } as React.CSSProperties}
              >
                Hiring?{" "}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void send(BRIEF_PROMPT)}
                  className="text-accent decoration-accent/40 hover:decoration-accent rounded-[3px] underline underline-offset-[3px] disabled:opacity-50"
                >
                  Get the 30-second recruiter brief
                </button>
                <span className="hidden md:inline">
                  {" · "}
                  <kbd className="border-line-strong rounded-[4px] border px-1 font-mono text-[11px]">
                    ⌘J
                  </kbd>{" "}
                  toggles this panel
                </span>
              </p>
            </div>
          )}

          {msgs.map((m, mi) =>
            m.role === "user" ? (
              <div key={m.id} className="ab-msg flex justify-end">
                <p className="bg-card border-line max-w-[85%] rounded-[14px] rounded-br-[4px] border px-3.5 py-2 break-words whitespace-pre-wrap">
                  <span className="sr-only">You: </span>
                  {m.content}
                </p>
              </div>
            ) : m.status === "offline" ? (
              <div key={m.id} className="ab-msg space-y-3">
                <div className="border-line-strong bg-card rounded-[14px] border p-4">
                  <p className="text-muted flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
                    <span
                      aria-hidden="true"
                      className="bg-muted size-1.5 rounded-full"
                    />
                    Live chat is paused
                  </p>
                  <span className="sr-only">ayan-bot: </span>
                  <p className="mt-2 text-[14px]">
                    That one needs the live model, which is off for now. The
                    suggested questions below still have answers, and Ayan reads
                    every email.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href="mailto:ayan.bhardwaj@utexas.edu"
                      className="bg-accent inline-flex min-h-9 items-center rounded-[9px] px-3 font-mono text-[11px] font-medium tracking-wider text-[color:var(--on-accent)] uppercase"
                    >
                      Email Ayan
                    </a>
                    {onBrowse && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onBrowse();
                        }}
                        className="border-line-strong hover:border-accent inline-flex min-h-9 items-center rounded-[9px] border px-3 font-mono text-[11px] tracking-wider uppercase transition-colors"
                      >
                        Browse with ⌘K
                      </button>
                    )}
                  </div>
                </div>
                {m === lastBot && starters("Questions with saved answers")}
              </div>
            ) : (
              <div key={m.id} className="ab-msg max-w-full">
                <p
                  aria-hidden="true"
                  className={`mb-1.5 font-mono text-[10px] tracking-[0.14em] uppercase ${m.status === "error" ? "text-down" : "text-accent"}`}
                >
                  ayan-bot ›{m.status === "stopped" && " stopped"}
                  {m.status === "error" && " status"}
                  {m.saved && <span className="text-muted"> saved answer</span>}
                </p>
                <span className="sr-only">ayan-bot: </span>
                <div
                  className={`break-words ${m.status === "error" ? "text-muted" : ""}`}
                >
                  {m.status === "streaming" && !m.content ? (
                    <span className="ab-typing" aria-hidden="true">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          style={{ "--i": i } as React.CSSProperties}
                        />
                      ))}
                    </span>
                  ) : (
                    <Markdown
                      text={m.content}
                      onNavigate={navigate}
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
                  )}
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
                {m.status === "done" && m.content && (
                  <>
                    <ProjectCards
                      items={projectsIn(m.content, { exclude: page })}
                      onNavigate={navigate}
                    />
                    <div className="mt-1.5 -ml-2 flex items-center">
                      <CopyButton text={m.content} />
                      <ListenButton text={m.content} />
                    </div>
                    {m === lastBot && !busy && (
                      <FollowUps
                        chips={followUps(
                          m.content,
                          msgs[mi - 1]?.role === "user"
                            ? msgs[mi - 1].content
                            : "",
                          asked,
                          page,
                        )}
                        disabled={busy}
                        onAsk={(q) => void send(q)}
                        onNavigate={navigate}
                      />
                    )}
                  </>
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
          <div
            role="group"
            aria-label="Answer for"
            className="text-muted mb-2 flex items-center gap-1 px-1 font-mono text-[10px] tracking-wide"
          >
            <span className="mr-1">answer for:</span>
            <button
              type="button"
              aria-pressed={audience === null}
              onClick={() => audience && pickAudience(audience)}
              className={`min-h-6 rounded-full border px-2 uppercase transition-colors ${
                audience === null
                  ? "border-accent text-accent"
                  : "hover:text-fg border-transparent"
              }`}
            >
              anyone
            </button>
            {AUDIENCES.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={audience === a}
                onClick={() => pickAudience(a)}
                className={`min-h-6 rounded-full border px-2 uppercase transition-colors ${
                  audience === a
                    ? "border-accent text-accent"
                    : "hover:text-fg border-transparent"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          {jd && (
            <div
              role="status"
              className="border-line bg-card text-muted mb-2 flex items-start gap-2 rounded-[10px] border px-3 py-2 text-[12.5px] leading-snug"
            >
              <p className="flex-1">
                That looks like a job description. Questions stop at{" "}
                {LIMITS.userChars} characters; the Fit check reads all of it, in
                your browser.{" "}
                <Link
                  href="/cv#fit"
                  className="text-accent underline underline-offset-4"
                  onClick={() => {
                    try {
                      sessionStorage.setItem(FIT_HANDOFF_KEY, jd);
                    } catch {
                      /* the event below still covers /cv itself */
                    }
                    window.dispatchEvent(
                      new CustomEvent(FIT_HANDOFF_EVENT, { detail: jd }),
                    );
                    setJd(null);
                    navigate();
                  }}
                >
                  Run the Fit check →
                </Link>
              </p>
              <button
                type="button"
                onClick={() => setJd(null)}
                aria-label="Dismiss the Fit check suggestion"
                className="text-muted hover:text-fg -mt-1 -mr-1 grid size-7 shrink-0 place-items-center"
              >
                ×
              </button>
            </div>
          )}
          {left === 0 && (
            <p
              id={`${counterId}-zero`}
              className="border-line bg-card text-muted mb-2 rounded-[10px] border px-3 py-2 text-[12.5px] leading-snug"
            >
              <span className="text-fg font-medium">
                Out of messages for now.
              </span>{" "}
              {retryMin
                ? `Refills in about ${retryMin} min.`
                : "The allowance refills in a few minutes."}{" "}
              Suggested questions and the recruiter brief still answer from
              saved briefs.
            </p>
          )}
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
              aria-describedby={
                left === 0 ? `${counterId}-zero ${counterId}` : counterId
              }
              placeholder={
                left === 0
                  ? "Out of messages, refills soon…"
                  : "Ask about Ayan…"
              }
              onChange={(e) => {
                setInput(e.target.value);
                if (!e.target.value) setJd(null);
              }}
              onPaste={(e) => {
                const t = e.clipboardData.getData("text");
                if (looksLikeJobDescription(t)) setJd(t.slice(0, 8000));
              }}
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
              className="placeholder:text-dim [field-sizing:content] max-h-28 min-h-9 flex-1 resize-none bg-transparent py-1.5 font-mono text-[16px] leading-6 outline-none focus-visible:outline-none md:text-[14px]"
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
            className="text-muted mt-1.5 flex min-h-4 items-center gap-3 px-1 font-mono text-[10px] tracking-wide"
          >
            <span className="min-w-0 truncate">
              <span className="hidden sm:inline">
                Answers only about Ayan ·{" "}
              </span>
              AI can be wrong
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-3">
              {remaining < 120 && (
                <span className={remaining < 60 ? "text-accent" : ""}>
                  {remaining} chars
                </span>
              )}
              {left !== null && <UsageMeter left={left} />}
            </span>
          </p>
        </form>
      </div>
    </>
  );
}
