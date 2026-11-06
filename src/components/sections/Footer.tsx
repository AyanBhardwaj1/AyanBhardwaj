import Link from "next/link";
import { links, profile, ui } from "@/content/content";
import { sections } from "@/content/extras";
import { formatDay, dataAsOf } from "@/lib/github";
import { AustinClock } from "../ui/MarketStatus";

/**
 * Inverted full-bleed slab that ends on a giant wordmark (design §5.10). The
 * letters rise into place as the last of the page scrolls in (CSS scroll
 * timeline; an IntersectionObserver fallback elsewhere).
 */
export function Footer({ hasResume }: { hasResume: boolean }) {
  return (
    <footer
      data-theme="dark"
      className="border-line bg-bg-elev text-fg relative overflow-hidden border-t"
    >
      <div
        data-reveal-stagger=""
        style={{ "--stagger": "90ms" } as React.CSSProperties}
        className="container-page grid gap-10 pt-20 pb-12 md:grid-cols-3"
      >
        <div>
          <h2 className="t-label text-muted mb-4">/Quick links</h2>
          <ul className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="pill min-h-10 px-4 normal-case">
                  {s.label}
                </a>
              </li>
            ))}
            {hasResume && (
              <li>
                <a
                  href={links.resume.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill min-h-10 px-4 normal-case"
                >
                  Résumé ↗
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="t-label text-muted mb-4">/Local time</h2>
          <p className="t-data text-[15px]">
            {profile.location} · <AustinClock />
          </p>
        </div>
        <div>
          <h2 className="t-label text-muted mb-4">/Colophon</h2>
          <p className="t-data text-muted">
            Archivo, Plex Mono, Instrument Serif · Next.js on Vercel · Last
            updated {formatDay(dataAsOf)}
          </p>
          <p className="t-data text-muted mt-3">
            {ui.footer.line} {ui.footer.smallPrint}
          </p>
        </div>
      </div>
      <div className="container-page flex items-end justify-between gap-4 pb-4">
        <p className="t-label text-muted">{ui.footer.alternates[0]}</p>
        <p className="t-label text-muted">
          <span className="hidden sm:inline">
            Press ⌘K · type HELP &lt;GO&gt; ·{" "}
          </span>
          <Link href="/terminal" className="link text-fg">
            Open the terminal
          </Link>
          {" · "}
          <Link href="/cv" className="link text-fg">
            One-page CV
          </Link>
        </p>
      </div>
      <div
        aria-hidden="true"
        className="container-page overflow-hidden pt-8 pb-[max(env(safe-area-inset-bottom),1.25rem)] select-none"
      >
        <p data-inview="" className="wm text-center">
          {["Ayan", "Bhardwaj"].map((word, w) => (
            <span key={word} className="wm-word">
              {[...word].map((ch, i) => (
                <span
                  key={i}
                  className="wm-l"
                  style={{ "--i": w * 5 + i } as React.CSSProperties}
                >
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
