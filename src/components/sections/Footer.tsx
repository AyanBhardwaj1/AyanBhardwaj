import { links, profile, ui } from "@/content/content";
import { sections } from "@/content/extras";
import { formatDay, dataAsOf } from "@/lib/github";
import { AustinClock } from "../ui/MarketStatus";

/** Inverted full-bleed slab with a giant cropped wordmark (design §5.10). */
export function Footer({ hasResume }: { hasResume: boolean }) {
  return (
    <footer
      data-theme="dark"
      className="border-line bg-bg-elev text-fg relative overflow-hidden border-t"
    >
      <div className="container-page grid gap-10 pt-20 pb-12 md:grid-cols-3">
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
        <p className="t-label text-muted hidden sm:block">
          Press ⌘K · type HELP &lt;GO&gt;
        </p>
      </div>
      <div aria-hidden="true" className="relative -mb-[0.18em] select-none">
        <p className="container-page t-display text-center text-[clamp(28px,7.4vw,106px)] leading-[0.8] whitespace-nowrap">
          {"Ayan Bhardwaj".split("").map((ch, i) => (
            <span
              key={i}
              className="text-fg/[0.06] hover:text-fg transition-colors duration-500"
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
