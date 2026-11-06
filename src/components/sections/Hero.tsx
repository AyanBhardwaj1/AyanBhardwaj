import Image from "next/image";
import { links, profile } from "@/content/content";
import { headshot } from "@/content/extras";
import { HeroField } from "../fx/HeroField";
import { TourLink } from "../fx/TourLink";
import { Konami } from "../fx/Konami";
import { Ticker, type TickerItem } from "../ui/Ticker";

function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="metal-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff6e6" />
          <stop offset=".45" stopColor="#c9b89a" />
          <stop offset=".55" stopColor="#6e6250" />
          <stop offset="1" stopColor="#ffd28a" />
        </linearGradient>
      </defs>
      <path
        d="M24 2c1.6 12.6 9.4 20.4 22 22-12.6 1.6-20.4 9.4-22 22C22.4 33.4 14.6 25.6 2 24 14.6 22.4 22.4 14.6 24 2Z"
        fill="url(#metal-a)"
      />
    </svg>
  );
}

function Candles({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="metal-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe2b0" />
          <stop offset=".5" stopColor="#8a7a62" />
          <stop offset="1" stopColor="#ffa31a" />
        </linearGradient>
      </defs>
      <g
        fill="url(#metal-b)"
        stroke="url(#metal-b)"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M14 10v44M32 4v40M50 14v44" fill="none" />
        <rect x="8" y="20" width="12" height="22" rx="2" />
        <rect x="26" y="12" width="12" height="18" rx="2" />
        <rect x="44" y="24" width="12" height="24" rx="2" />
      </g>
    </svg>
  );
}

function Sparkline() {
  // A small upward line, decorative (the "$AYAN" quote).
  return (
    <svg
      viewBox="0 0 64 20"
      className="h-5 w-16"
      aria-hidden="true"
      fill="none"
    >
      <path
        className="hx-spark-line"
        pathLength={1}
        d="M1 17 9 14l7 2 8-6 7 1 8-5 7 2 8-6 8-2"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Each letter rises out of a mask in a stagger (CSS only; see .hx-letter).
 * Runs before hydration and needs no JS, so the name is never held back.
 * --c (distance from the word's center) spreads the letters apart as the
 * hero scrolls away (scroll-driven, where supported).
 */
function Letters({ word, delay = 0 }: { word: string; delay?: number }) {
  return (
    <span aria-hidden="true" className="hx-line block whitespace-nowrap">
      {[...word].map((ch, i) => (
        <span
          key={i}
          className="hx-letter"
          style={
            {
              "--i": i,
              "--c": i - (word.length - 1) / 2,
              "--line-delay": `${delay}ms`,
            } as React.CSSProperties
          }
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

/** Staggered entrance for the supporting copy (opacity + small rise). */
const rise = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export function Hero({
  ticker,
  hasResume,
}: {
  ticker: TickerItem[];
  hasResume: boolean;
}) {
  return (
    <section
      id="top"
      aria-label="Introduction"
      className="hx-hero relative isolate flex min-h-svh flex-col pt-16 md:pt-[clamp(7rem,13vh,9rem)]"
    >
      <HeroField />
      <Konami />
      <div className="container-page relative flex flex-1 flex-col items-center text-center">
        <p
          className="hx-rise t-label text-muted mb-5 text-balance md:mb-[min(2.5rem,3.5vh)]"
          style={rise(0)}
        >
          <span className="text-accent">{"//"}</span> SWE + AI · CS &amp;
          Business (CSB Honors) @ UT Austin
        </p>

        <h1
          aria-label={profile.name}
          className="t-display relative z-0 [font-size:var(--hero-size)]"
        >
          <Letters word="Ayan" delay={40} />
          <Letters word="Bhardwaj" delay={130} />
        </h1>

        <div
          className="relative z-10 mt-4 flex justify-center sm:mt-[0.08em]"
          style={{ fontSize: "var(--hero-size)" }}
        >
          <Spark className="hx-glyph absolute top-[-0.2em] left-[-1.4em] hidden size-[0.42em] md:block" />
          <Candles className="hx-glyph hx-glyph-b absolute right-[-1.5em] bottom-[0.6em] hidden size-[0.5em] md:block" />
          <figure className="hx-portrait group border-line-strong bg-card relative w-[clamp(108px,min(30vw,17vh),144px)] overflow-hidden rounded-xl border text-base md:w-[clamp(128px,min(15vw,19vh),230px)]">
            <Image
              src={headshot.src}
              alt={headshot.alt}
              width={headshot.width}
              height={headshot.height}
              sizes="(max-width: 768px) 144px, 260px"
              preload
              className="hx-portrait-img aspect-[4/5] w-full object-cover object-[50%_30%] contrast-[1.08] grayscale transition-[filter] duration-700 group-hover:grayscale-0"
            />
            {/* duotone grade: warm shadows + amber rim, fades on hover */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgb(255_163_26/0.28),transparent_45%,rgb(40_22_6/0.55))] mix-blend-multiply transition-opacity duration-700 group-hover:opacity-0"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10 ring-inset"
            />
          </figure>
          <span className="hx-chip hx-chip-r t-label border-line-strong bg-bg/80 absolute top-4 left-[calc(100%-2.25rem)] rounded-full border px-3 py-1.5 whitespace-nowrap backdrop-blur sm:top-[0.15em] sm:left-full sm:ml-3">
            <span className="text-up">▲</span> YC × 2
          </span>
          <span className="hx-chip hx-chip-l t-label border-line-strong bg-bg/80 absolute right-[calc(100%-4.5rem)] bottom-6 rounded-full border px-3 py-1.5 whitespace-nowrap backdrop-blur sm:right-full sm:bottom-[0.25em] sm:mr-3">
            <span className="text-accent">●</span>{" "}
            {profile.status?.label ?? "Building YouBank"}
          </span>
        </div>

        <p
          className="hx-rise t-lead mt-5 max-w-[24ch] text-balance md:mt-[min(2.5rem,3vh)]"
          style={rise(420)}
        >
          {profile.headline}
        </p>
        <p className="hx-rise text-muted mt-4 max-w-[52ch]" style={rise(500)}>
          {/* The short line on phones and on short laptop screens. */}
          <span className="md:hidden [@media(max-height:800px)]:inline">
            {profile.subheadlineShort}
          </span>
          <span className="hidden md:inline [@media(max-height:800px)]:hidden">
            {profile.subheadline}
          </span>
        </p>
        <div
          className="hx-rise mt-5 grid w-full max-w-[22rem] grid-cols-2 gap-2 sm:mt-6 sm:flex sm:w-auto sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-3"
          style={rise(580)}
        >
          <a
            href="#projects"
            className="pill pill-solid col-span-2"
            data-magnetic=""
          >
            See my work
          </a>
          <a
            href="#contact"
            className={`pill ${hasResume ? "" : "col-span-2"}`}
            data-magnetic=""
          >
            Get in touch
          </a>
          {hasResume && (
            <a
              href={links.resume.href}
              target="_blank"
              rel="noopener noreferrer"
              className="pill"
            >
              Résumé{" "}
              <span className="arrow" aria-hidden="true">
                ↗
              </span>
              <span className="sr-only">(PDF, opens in a new tab)</span>
            </a>
          )}
        </div>
        <div className="hx-rise mt-3" style={rise(640)}>
          <TourLink />
        </div>

        <div
          className="hx-rise mt-auto flex w-full flex-col items-center gap-6 pt-16 pb-8 text-left sm:flex-row sm:items-end sm:justify-between"
          style={rise(700)}
        >
          <div className="flex items-end gap-4">
            <span className="text-[clamp(32px,4vw,48px)] leading-none font-semibold tracking-[-0.035em]">
              $AYAN
            </span>
            <div className="t-data pb-1">
              <Sparkline />
              <span className="text-up">▲ +2 YC internships</span>
            </div>
          </div>
          <div className="t-label text-muted flex flex-col items-center gap-1 sm:items-end">
            <span>/Austin, TX · 30.28°N 97.73°W</span>
            <a href="#about" className="link text-fg">
              scroll_to_enter ↓
            </a>
          </div>
        </div>
      </div>
      <div className="hx-ticker">
        <Ticker items={ticker} />
      </div>
    </section>
  );
}
