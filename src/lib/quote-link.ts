/**
 * A link that opens a page scrolled to a quote and highlights it, using a
 * text fragment (`#:~:text=`). Browsers without support just open the page.
 *
 * Short quotes are matched whole. Longer ones use `start,end` (a few words
 * from each end), which survives the line breaks and block boundaries that a
 * long selection crosses and keeps the link short enough to paste anywhere.
 */

const WHOLE_MAX = 80;
const EDGE_WORDS = 5;

/** Percent-encode for a text directive: `-`, `,` and `&` are syntax there. */
function enc(s: string): string {
  return encodeURIComponent(s).replace(
    /[-,&]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

/**
 * The fragment for a quote, or "" when there is nothing to quote. A quote
 * that crosses block elements (its raw text has line breaks) always uses
 * start,end taken from its first and last lines: one text term cannot match
 * across a block boundary, but a range between two terms can.
 */
export function textFragment(raw: string): string {
  const lines = raw
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (!lines.length) return "";
  if (lines.length > 1) {
    const start = lines[0].split(" ").slice(0, EDGE_WORDS).join(" ");
    const end = lines[lines.length - 1].split(" ").slice(-EDGE_WORDS).join(" ");
    return `#:~:text=${enc(start)},${enc(end)}`;
  }
  const text = lines[0];
  const words = text.split(" ");
  if (text.length <= WHOLE_MAX || words.length <= EDGE_WORDS * 2)
    return `#:~:text=${enc(text)}`;
  const start = words.slice(0, EDGE_WORDS).join(" ");
  const end = words.slice(-EDGE_WORDS).join(" ");
  return `#:~:text=${enc(start)},${enc(end)}`;
}

/** The page URL (without its own #hash) plus the quote's fragment. */
export function quoteLink(pageUrl: string, raw: string): string {
  const base = pageUrl.split("#")[0];
  return base + textFragment(raw);
}
