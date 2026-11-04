/**
 * Reveal-on-scroll without per-element hydration: a server-rendered wrapper
 * with data-reveal, toggled by the single RevealObserver on the page.
 * Content is visible without JS (the hidden start state only applies once
 * html.js is set by the inline head script).
 *
 * variant  "up" (default: fade + 24px rise) · "fade" · "blur" (soft focus-in)
 *          · "mask" (wipes up from the bottom edge; good for images) · "scale"
 * stagger  true (60ms) or a step in ms: the wrapper stays put and its direct
 *          children arrive one after another (first 10 are stepped).
 * delay    seconds before it starts (unchanged from v1).
 */
export type RevealVariant = "up" | "fade" | "blur" | "mask" | "scale";

export function Reveal({
  children,
  delay = 0,
  className,
  as: Comp = "div",
  id,
  variant = "up",
  stagger,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?:
    | "div"
    | "li"
    | "ul"
    | "ol"
    | "section"
    | "article"
    | "header"
    | "figure"
    | "p"
    | "span";
  id?: string;
  variant?: RevealVariant;
  stagger?: boolean | number;
}) {
  const style: Record<string, string> = {};
  if (delay) style["--reveal-delay"] = `${delay}s`;
  if (typeof stagger === "number") style["--stagger"] = `${stagger}ms`;
  const attrs = stagger
    ? { "data-reveal-stagger": "" }
    : { "data-reveal": variant === "up" ? "" : variant };
  return (
    <Comp
      id={id}
      {...attrs}
      className={className}
      style={
        Object.keys(style).length ? (style as React.CSSProperties) : undefined
      }
    >
      {children}
    </Comp>
  );
}
