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

/** The fragment for a quote, or "" when there is nothing to quote. */
export function textFragment(raw: string): string {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return "";
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
