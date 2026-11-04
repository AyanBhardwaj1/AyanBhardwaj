import Link from "next/link";
import type { Metadata } from "next";
import { ui } from "@/content/content";
import { sections } from "@/content/extras";
import { StatusBar } from "@/components/StatusBar";

export const metadata: Metadata = {
  title: "404 · Security not found",
  robots: { index: false },
};

const SUGGEST = sections.filter((s) =>
  ["projects", "experience", "contact"].includes(s.id),
);

/** A delisted ticker: the price chart falls off a cliff, then a way home. */
export default function NotFound() {
  return (
    <>
      <StatusBar />
      <main
        id="main"
        className="container-page relative flex min-h-svh flex-col justify-center pt-20 pb-16"
      >
        <p
          className="hx-rise t-data text-down"
          style={{ "--d": "0ms" } as React.CSSProperties}
        >
          <span aria-hidden="true">▼ </span>404 · SECURITY NOT FOUND · TRADING
          HALTED
        </p>

        <div className="relative mt-6 self-start">
          <p aria-hidden="true" className="nf-code select-none">
            {["4", "0", "4"].map((d, i) => (
              <span key={i} className="hx-line inline-block">
                <span
                  className="nf-digit inline-block"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  {d}
                </span>
              </span>
            ))}
          </p>
          {/* The chart: steady, steady, delisted. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            className="text-down pointer-events-none absolute inset-x-[-2%] top-[30%] h-[40%] w-[104%] opacity-90"
            fill="none"
          >
            <path
              className="nf-dip"
              pathLength={1}
              strokeDasharray="1"
              d="M0 40 30 34 58 42 86 30 118 36 150 24 182 30 214 20 246 28 262 26 276 104 300 98 330 112 360 106 400 116"
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          className="hx-rise t-h2 mt-8 max-w-[18ch]"
          style={{ "--d": "260ms" } as React.CSSProperties}
        >
          {ui.notFound.heading}
        </h1>
        <p
          className="hx-rise t-data text-muted mt-5"
          style={{ "--d": "340ms" } as React.CSSProperties}
        >
          <span className="text-accent">AYAN &gt;</span> try PROJ, EXP or HELP
          &lt;GO&gt;
          <span aria-hidden="true" className="term-cursor text-accent">
            {" "}
            ▍
          </span>
        </p>
        <nav
          aria-label="Suggested pages"
          className="hx-rise mt-10 flex flex-wrap gap-3"
          style={{ "--d": "420ms" } as React.CSSProperties}
        >
          <Link href="/" className="pill pill-solid" data-magnetic="">
            {ui.notFound.button}
          </Link>
          {SUGGEST.map((s) => (
            <Link key={s.id} href={`/#${s.id}`} className="pill">
              <span className="text-accent">{s.mnemonic}</span> {s.label}
            </Link>
          ))}
        </nav>
      </main>
    </>
  );
}
