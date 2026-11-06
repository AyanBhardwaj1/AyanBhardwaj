import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/**
 * Markdown-lite for ayan-bot replies: paragraphs, "- " / "1. " lists,
 * **bold**, `code`, [label](url) links and the <GO> key. Everything is
 * rendered as React text nodes (escaped by React); no HTML from the model is
 * ever injected. Links are limited to same-site paths, https and mailto.
 */

const INLINE =
  /\*\*([^*\n]+)\*\*|`([^`\n]+)`|\[([^\]\n]{1,120})\]\(([^)\s]{1,400})\)|<GO>/g;

function safeHref(raw: string): { href: string; internal: boolean } | null {
  const href = raw.trim();
  if (href.startsWith("/") && !href.startsWith("//"))
    return {
      href,
      internal: !/\.(pdf|txt|json)$/i.test(href.split(/[?#]/)[0]),
    };
  if (href.startsWith("#")) return { href, internal: false };
  try {
    const u = new URL(href);
    if (u.protocol === "https:" || u.protocol === "mailto:")
      return { href: u.toString(), internal: false };
  } catch {
    /* not a URL */
  }
  return null;
}

function GoKey() {
  return (
    <span className="border-accent/50 text-accent mx-0.5 inline-block rounded-[4px] border px-1 align-[1px] font-mono text-[10px] leading-[16px] font-medium tracking-wider">
      GO
    </span>
  );
}

function inline(
  text: string,
  key: string,
  onNavigate?: () => void,
): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const k = `${key}-${i++}`;
    if (m[1] !== undefined) {
      out.push(
        <strong key={k} className="text-fg font-semibold">
          {/* Bold can wrap links and code ("**[YouBank](/projects/youbank)**"). */}
          {inline(m[1], k, onNavigate)}
        </strong>,
      );
    } else if (m[2] !== undefined) {
      out.push(
        <code
          key={k}
          className="bg-card rounded-[4px] px-1 py-px font-mono text-[0.9em]"
        >
          {m[2]}
        </code>,
      );
    } else if (m[3] !== undefined && m[4] !== undefined) {
      const safe = safeHref(m[4]);
      const cls =
        "text-accent underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent";
      if (!safe) out.push(m[3]);
      else if (safe.internal)
        out.push(
          <Link key={k} href={safe.href} className={cls} onClick={onNavigate}>
            {m[3]}
          </Link>,
        );
      else
        out.push(
          <a
            key={k}
            href={safe.href}
            className={cls}
            {...(safe.href.startsWith("https:")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {m[3]}
            {safe.href.startsWith("https:") && (
              <span aria-hidden="true">↗</span>
            )}
          </a>,
        );
    } else {
      out.push(<GoKey key={k} />);
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  { kind: "p"; lines: string[] } | { kind: "ul" | "ol"; items: string[] };

function blocks(src: string): Block[] {
  const out: Block[] = [];
  for (const line of src.split("\n")) {
    const t = line.trim();
    const ul = /^[-*•]\s+(.*)$/.exec(t);
    const ol = /^\d{1,2}[.)]\s+(.*)$/.exec(t);
    const prev = out.at(-1);
    if (!t) {
      out.push({ kind: "p", lines: [] });
    } else if (ul || ol) {
      const kind = ul ? "ul" : "ol";
      const item = (ul ?? ol)![1];
      if (prev && prev.kind === kind) prev.items.push(item);
      else out.push({ kind, items: [item] });
    } else if (prev && prev.kind === "p") {
      prev.lines.push(t);
    } else {
      out.push({ kind: "p", lines: [t] });
    }
  }
  return out.filter((b) => (b.kind === "p" ? b.lines.length > 0 : true));
}

export function Markdown({
  text,
  cursor,
  onNavigate,
}: {
  text: string;
  cursor?: ReactNode;
  onNavigate?: () => void;
}) {
  const bs = blocks(text);
  return (
    <div className="space-y-2.5">
      {bs.map((b, bi) => {
        const isLast = bi === bs.length - 1;
        if (b.kind === "p")
          return (
            <p key={bi}>
              {b.lines.map((l, li) => (
                <Fragment key={li}>
                  {li > 0 && <br />}
                  {inline(l, `${bi}-${li}`, onNavigate)}
                </Fragment>
              ))}
              {isLast && cursor}
            </p>
          );
        const List = b.kind;
        return (
          <List
            key={bi}
            className={`space-y-1 pl-5 ${b.kind === "ul" ? "marker:text-accent list-['›__']" : "marker:text-accent list-decimal"}`}
          >
            {b.items.map((it, ii) => (
              <li key={ii}>
                {inline(it, `${bi}-${ii}`, onNavigate)}
                {isLast && ii === b.items.length - 1 && cursor}
              </li>
            ))}
          </List>
        );
      })}
      {bs.length === 0 && cursor}
    </div>
  );
}
