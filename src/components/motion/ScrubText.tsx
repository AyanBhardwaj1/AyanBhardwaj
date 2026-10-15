import type { CSSProperties } from "react";

/**
 * Manifesto paragraph: words go from 15% to full ink, one by one, as the
 * paragraph scrolls through the viewport. Pure CSS scroll-driven animation
 * (a named view timeline on the paragraph); browsers without support, and
 * reduced motion, show full ink. Zero JS.
 */
export function ScrubText({
  text,
  className,
  accent,
  serif = [],
}: {
  text: string;
  className?: string;
  accent?: string;
  serif?: string[];
}) {
  const words = text.split(" ");
  const style = (w: string) =>
    w === accent
      ? "text-accent"
      : serif.includes(w)
        ? "t-serif text-[1.08em] tracking-normal"
        : undefined;
  return (
    <p className={`scrub ${className ?? ""}`}>
      {words.map((w, i) => (
        <span
          key={i}
          className={style(w)}
          style={
            {
              "--s": `${(i / words.length) * 100}%`,
              "--e": `${((i + 1) / words.length) * 100}%`,
            } as CSSProperties
          }
        >
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
