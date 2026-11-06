"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { copyText, type Chip } from "./derive";

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / denied permission: the textarea fallback.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Copies an answer as plain text; says "Copied" for 1.5 s. */
export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = window.setTimeout(() => setState("idle"), 1500);
    return () => window.clearTimeout(t);
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={async () =>
          setState(
            (await writeClipboard(copyText(text, window.location.origin)))
              ? "copied"
              : "failed",
          )
        }
        className="text-muted hover:text-fg hover:bg-card inline-flex min-h-8 items-center gap-1.5 rounded-[7px] px-2 font-mono text-[10.5px] tracking-wider uppercase transition-colors"
      >
        {state === "copied" ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="text-accent size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3.5 8.5 3 3 6-7" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          >
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
            <path d="M10.5 3.5v-.25A.75.75 0 0 0 9.75 2.5h-6.5a.75.75 0 0 0-.75.75v6.5c0 .41.34.75.75.75h.25" />
          </svg>
        )}
        <span className="min-w-[6ch] text-left">
          {state === "copied"
            ? "Copied"
            : state === "failed"
              ? "Failed"
              : "Copy"}
        </span>
        <span className="sr-only"> answer</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {state === "copied"
          ? "Answer copied"
          : state === "failed"
            ? "Couldn't copy"
            : ""}
      </span>
    </>
  );
}

const chipCls =
  "ab-chip border-line bg-card hover:border-accent/60 hover:bg-card-hover inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-left text-[13px] disabled:opacity-50";

/** Follow-up suggestions under the latest answer. */
export function FollowUps({
  chips,
  disabled,
  onAsk,
  onNavigate,
}: {
  chips: Chip[];
  disabled?: boolean;
  onAsk: (prompt: string) => void;
  onNavigate?: () => void;
}) {
  if (!chips.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Follow-up questions">
      {chips.map((c, i) => (
        <li
          key={c.kind === "ask" ? c.prompt : c.href}
          className="ab-starter"
          style={{ "--i": i } as React.CSSProperties}
        >
          {c.kind === "ask" ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAsk(c.prompt)}
              className={chipCls}
            >
              {c.label}
              <span aria-hidden="true" className="ab-chip-go text-accent">
                →
              </span>
            </button>
          ) : c.external ? (
            <a href={c.href} className={chipCls}>
              <span aria-hidden="true" className="text-accent">
                @
              </span>
              {c.label}
            </a>
          ) : (
            <Link href={c.href} onClick={onNavigate} className={chipCls}>
              {c.label}
              <span aria-hidden="true" className="text-accent">
                ↗
              </span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

/** "N left" with a 10-segment bar. */
export function UsageMeter({ left }: { left: number }) {
  const filled = Math.min(10, Math.max(0, left));
  const low = left <= 3;
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${low ? "text-accent" : ""}`}
      title="Messages left for now; the allowance refills over time."
    >
      <span aria-hidden="true" className="flex items-center gap-[2px]">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={`ab-seg h-2 w-[3px] rounded-[1px] ${i < filled ? "bg-accent" : "bg-line-strong"}`}
          />
        ))}
      </span>
      <span>
        {left}{" "}
        <span className="sr-only">{left === 1 ? "message" : "messages"} </span>
        left
      </span>
    </span>
  );
}

/**
 * Reads an answer aloud with the browser's speech synthesis (no microphone,
 * nothing leaves the device). Hidden where speech synthesis isn't available.
 * Starting one answer stops any other.
 */
export function ListenButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  /** This button's identity, so only its own unmount cancels its speech. */
  const [me] = useState(() => ({}));

  useEffect(() => {
    // Only offer it when the browser actually has a voice to speak with
    // (voices can arrive late, hence voiceschanged).
    const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
    const check = () => setSupported(!!synth && synth.getVoices().length > 0);
    check();
    synth?.addEventListener("voiceschanged", check);
    return () => {
      synth?.removeEventListener("voiceschanged", check);
      if ("speechSynthesis" in window && speakingRef.owner === me) {
        window.speechSynthesis.cancel();
        speakingRef.owner = null;
      }
    };
  }, [me]);

  if (!supported) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    // Links read as their labels; drop markdown symbols and <GO> flourishes.
    const spoken = text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/<GO>/g, "")
      .replace(/[*_`#>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const u = new SpeechSynthesisUtterance(spoken);
    u.lang = "en-US";
    u.rate = 1.03;
    u.onend = u.onerror = () => {
      setSpeaking(false);
      if (speakingRef.owner === me) speakingRef.owner = null;
    };
    speakingRef.owner = me;
    synth.speak(u);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className="text-muted hover:text-fg hover:bg-card inline-flex min-h-8 items-center gap-1.5 rounded-[7px] px-2 font-mono text-[10.5px] tracking-wider uppercase transition-colors"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className={`size-3.5 ${speaking ? "text-accent" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.5 6v4h2.5l3.5 3V3L5 6z" />
        {speaking ? (
          <path d="M11 6.5 13.5 9M13.5 6.5 11 9" />
        ) : (
          <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6.5 6.5 0 0 1 0 9" />
        )}
      </svg>
      <span>{speaking ? "Stop" : "Listen"}</span>
    </button>
  );
}

/** Which answer is currently being spoken (so unmounting one stops it). */
const speakingRef: { owner: object | null } = { owner: null };
