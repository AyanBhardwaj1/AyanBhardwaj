import { Fragment, type CSSProperties } from "react";
import "./mid.css";

const TEXT = "From thesis to ship: tools that turn messy data into decisions.";
const SERIF = new Set(["messy", "data"]);
const ACCENT = "decisions.";

/**
 * Manifesto interstitial: a framed "memo" whose words ink in one by one as it
 * scrolls toward the middle of the viewport (CSS scroll-driven animation on a
 * shared view timeline), with a progress rule that fills in step. Browsers
 * without scroll timelines get a one-shot staggered ink-in when it enters
 * (RevealObserver's .is-in). Reduced motion and no-JS: full ink, static.
 */
export function Manifesto() {
  const words = TEXT.split(" ");
  const n = words.length;
  return (
    <section aria-label="Manifesto" className="md-mani">
      <div className="container-page">
        <div className="md-mani-frame" data-inview="">
          <div className="t-label text-muted flex items-center justify-between gap-4">
            <span>
              <span className="text-accent">AYAN</span> · Operating thesis
            </span>
            <span aria-hidden="true" className="tabular-nums">
              Memo 01
            </span>
          </div>
          <p className="md-mani-text">
            {words.map((w, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span
                  className={[
                    "md-mani-w",
                    w === ACCENT && "md-mani-accent",
                    SERIF.has(w) && "t-serif md-mani-serif",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    {
                      "--i": i,
                      "--s": `${(i / n) * 100}%`,
                      "--e": `${((i + 1) / n) * 100}%`,
                    } as CSSProperties
                  }
                >
                  {w}
                </span>
              </Fragment>
            ))}
          </p>
          <div className="t-label text-muted flex items-center gap-4">
            <span aria-hidden="true">Thesis</span>
            <span aria-hidden="true" className="md-mani-rule">
              <span />
            </span>
            <span aria-hidden="true">Ship</span>
          </div>
        </div>
      </div>
    </section>
  );
}
