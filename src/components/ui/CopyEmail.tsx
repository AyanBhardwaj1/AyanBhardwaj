"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The contact console's address + COPY button. On copy: the button's label
 * rolls over to an amber "Copied" with a drawn check, the address gets a
 * highlighter sweep, and the result is announced politely. If the clipboard
 * is unavailable, the button says so and the address stays selectable.
 * Re-clicking restarts the timer (no stacked timeouts).
 */
export function CopyEmail({
  email,
  href,
  copiedText,
}: {
  email: string;
  href: string;
  copiedText: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  };

  return (
    <>
      <a
        href={href}
        data-state={state}
        className="lw-addr link text-fg mr-auto text-[17px] break-all"
      >
        {email}
      </a>
      <button
        type="button"
        onClick={copy}
        data-state={state}
        className="lw-copy pill min-h-10"
      >
        <span className="lw-copy-track" aria-hidden="true">
          <span className="lw-copy-a">[ Copy ]</span>
          <span className="lw-copy-b">
            {state === "failed" ? (
              "Select it ↑"
            ) : (
              <>
                <svg viewBox="0 0 16 16" className="lw-check size-3.5">
                  <path
                    d="M3 8.5 6.5 12 13 4.5"
                    pathLength={1}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Copied
              </>
            )}
          </span>
        </span>
        <span className="sr-only">
          {state === "idle" ? "Copy email address" : ""}
        </span>
      </button>
      <span aria-live="polite" className="sr-only">
        {state === "copied"
          ? copiedText
          : state === "failed"
            ? `Couldn't copy. The address is ${email}`
            : ""}
      </span>
    </>
  );
}
