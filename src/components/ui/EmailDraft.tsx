"use client";

import { useId, useMemo, useState } from "react";

/**
 * "> draft --to ayan": a tiny composer that writes a clear first email and
 * hands it to the visitor's own mail app (mailto:) or copies it. Nothing is
 * sent from the site and nothing leaves the browser until they hit send.
 */

const PURPOSES = [
  {
    id: "role",
    label: "Internship / role",
    subject: (co: string) => `${co ? `${co}: ` : ""}role for Ayan`,
    opener: "I came across your portfolio and would like to talk about a role",
  },
  {
    id: "build",
    label: "Build something",
    subject: (co: string) => `Project idea${co ? ` from ${co}` : ""}`,
    opener: "I have a project in mind and think you'd be a great fit",
  },
  {
    id: "youbank",
    label: "YouBank",
    subject: () => "About YouBank",
    opener: "I saw YouBank on your site and would love to learn more",
  },
  {
    id: "hi",
    label: "Just saying hi",
    subject: () => "Hello from your portfolio",
    opener: "I just wanted to say hi after seeing your work",
  },
] as const;

type PurposeId = (typeof PURPOSES)[number]["id"];

const clip = (s: string, n: number) =>
  s.trim().replace(/\s+/g, " ").slice(0, n);

export function EmailDraft({ to }: { to: string }) {
  const uid = useId();
  const [purpose, setPurpose] = useState<PurposeId>("role");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const draft = useMemo(() => {
    const p = PURPOSES.find((x) => x.id === purpose) ?? PURPOSES[0];
    const co = clip(company, 60);
    const who = clip(name, 60);
    const subject = p.subject(co);
    const body = [
      "Hi Ayan,",
      "",
      `${who ? `I'm ${who}${co ? ` from ${co}` : ""}. ` : co ? `I'm reaching out from ${co}. ` : ""}${p.opener}.`,
      ...(note.trim() ? ["", note.trim().slice(0, 1200)] : []),
      "",
      "Best,",
      who || "",
    ]
      .join("\n")
      .trimEnd();
    return { subject, body };
  }, [purpose, name, company, note]);

  const href = `mailto:${to}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `To: ${to}\nSubject: ${draft.subject}\n\n${draft.body}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const field =
    "border-line-strong bg-bg focus-visible:border-accent w-full rounded-[8px] border px-3 py-2 font-sans text-[15px] text-fg placeholder:text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40";

  return (
    <details className="group/draft border-line mt-6 border-t pt-5">
      <summary className="text-muted hover:text-fg flex min-h-10 cursor-pointer list-none items-center justify-between marker:hidden">
        <span>
          <span className="text-accent">&gt;</span> draft --to ayan
        </span>
        <span
          aria-hidden="true"
          className="text-lg transition-transform group-open/draft:rotate-45"
        >
          +
        </span>
      </summary>

      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = href;
        }}
      >
        <fieldset>
          <legend className="text-muted mb-2">About</legend>
          <div className="flex flex-wrap gap-2">
            {PURPOSES.map((p) => (
              <label
                key={p.id}
                className={`pill min-h-9 cursor-pointer px-3 text-[12px] normal-case has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[color:var(--accent)] ${purpose === p.id ? "border-accent text-accent" : ""}`}
              >
                <input
                  type="radio"
                  name={`${uid}-purpose`}
                  value={p.id}
                  checked={purpose === p.id}
                  onChange={() => setPurpose(p.id)}
                  className="sr-only"
                />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-name`} className="text-muted mb-1 block">
              Your name
            </label>
            <input
              id={`${uid}-name`}
              name="name"
              autoComplete="name"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Lee…"
              className={field}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-co`} className="text-muted mb-1 block">
              Company <span className="text-dim">(optional)</span>
            </label>
            <input
              id={`${uid}-co`}
              name="organization"
              autoComplete="organization"
              maxLength={60}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Capital…"
              className={field}
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${uid}-note`} className="text-muted mb-1 block">
            Anything to add <span className="text-dim">(optional)</span>
          </label>
          <textarea
            id={`${uid}-note`}
            name="note"
            rows={3}
            maxLength={1200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="The role, a link, a time that works…"
            className={`${field} resize-y`}
          />
        </div>
        <div className="border-line rounded-[8px] border p-3">
          <p className="text-muted">
            Subject: <span className="text-fg">{draft.subject}</span>
          </p>
          <p className="text-fg/80 mt-2 font-sans text-[14px] whitespace-pre-line">
            {draft.body}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="pill pill-solid min-h-10">
            Open in email app <span aria-hidden="true">↗</span>
          </button>
          <button type="button" onClick={copy} className="pill min-h-10">
            {copied ? "Copied" : "Copy draft"}
          </button>
          <span className="sr-only" aria-live="polite">
            {copied ? "Draft copied to the clipboard." : ""}
          </span>
        </div>
      </form>
    </details>
  );
}
