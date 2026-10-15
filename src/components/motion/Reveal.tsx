/**
 * Reveal-on-scroll without per-element hydration: a server-rendered wrapper
 * with data-reveal, toggled by the single RevealObserver in the layout.
 * Content is visible without JS (the hidden start state only applies once
 * html.js is set by the inline head script).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Comp = "div",
  id,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
  id?: string;
}) {
  return (
    <Comp
      id={id}
      data-reveal=""
      className={className}
      style={
        delay
          ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </Comp>
  );
}
