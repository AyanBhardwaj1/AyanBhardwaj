import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import {
  ProjectName,
  ProjectShell,
} from "@/components/project-page/ProjectShell";
import { CanopyReveal } from "@/components/projects/walk-free/CanopyReveal";
import { DayPlate } from "@/components/projects/walk-free/DayPlate";
import { PlantRow } from "@/components/projects/walk-free/PlantRow";
import { Playing } from "@/components/projects/walk-free/Playing";
import { Postcards } from "@/components/projects/walk-free/Postcards";
import { RouteDuel } from "@/components/projects/walk-free/RouteDuel";
import "@/components/projects/walk-free/walkfree.css";
import { projectMetadata } from "@/lib/projects";
import {
  FACTS,
  LINKS,
  PIPELINE,
  ROUTE_TYPES,
  SHOTS,
  STACK,
  TOOLS,
} from "./data";
import { playfair } from "./fonts";

export const metadata = projectMetadata("walk-free", {
  title: "Walk-Free: the shady way across campus",
  description:
    "Heat-aware walking for campuses and cities. Walk-Free colours every path by how hot it feels at the hour you walk it, finds the shadiest way there, and lets Meta's Muse Spark plan the walk.",
  image: {
    src: SHOTS.hero.src,
    width: SHOTS.hero.width,
    height: SHOTS.hero.height,
    alt: "Walk-Free at UT Austin with a shade route across campus",
  },
});

// two landscape shots stacked beside the phone, then the landing page full width
const GALLERY_CELLS = [
  "md:col-span-7",
  "md:col-span-7 md:row-start-2",
  "md:col-span-12",
  "md:col-span-5 md:col-start-8 md:row-span-2 md:row-start-1",
];

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function Page() {
  return (
    <ProjectShell slug="walk-free" className={`wf ${playfair.variable}`}>
      {/* ---------- cover ---------- */}
      <section
        aria-labelledby="project-title"
        className="wf-wrap grid gap-10 pt-14 pb-20 md:pt-20 lg:grid-cols-12 lg:gap-12 lg:pb-28"
      >
        <div className="flex flex-col lg:col-span-5">
          <p className="wf-coord">Austin, Texas · 30.29° N · July, 3:00 PM</p>
          <ProjectName slug="walk-free" className="wf-h1 mt-6">
            Walk-Free
          </ProjectName>
          <p className="wf-statement mt-8">
            See how hot every street feels at the hour you walk it, then take
            the shady way there.
          </p>
          <p className="wf-body mt-6">
            Heat-aware walking for campuses and cities, built for the Meta
            Global AI Developer Hackathon (Indie track). Meta&rsquo;s Muse Spark
            plans the walk in your own language; the map works without an
            account.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href={LINKS.demo} {...ext} className="wf-btn">
              Try the demo{" "}
              <span className="wf-arrow" aria-hidden="true">
                ↗
              </span>
              <span className="sr-only">
                {" "}
                (opens the UT Austin tour in a new tab)
              </span>
            </a>
            <a href={LINKS.site} {...ext} className="wf-btn wf-btn-ghost">
              Visit the site{" "}
              <span className="wf-arrow" aria-hidden="true">
                ↗
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a
              href={LINKS.code}
              {...ext}
              className="wf-link ml-2 text-[16px] font-semibold"
            >
              Code on GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
        <figure className="lg:col-span-7 lg:self-end">
          <div className="wf-shot overflow-hidden bg-(--wf-paper-2)">
            <Image
              src={SHOTS.hero.src}
              width={SHOTS.hero.width}
              height={SHOTS.hero.height}
              alt={SHOTS.hero.alt}
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="h-auto w-full"
            />
          </div>
          <figcaption className="wf-small mt-3">
            The real app at UT Austin. The more-shade walk is 15 minutes against
            14 for the quickest, with 55% less sun.
          </figcaption>
        </figure>
      </section>

      {/* ---------- facts row ---------- */}
      <section aria-labelledby="wf-facts-h" className="bg-(--wf-paper-2)">
        <div className="wf-wrap py-16 md:py-24">
          <h2 id="wf-facts-h" className="sr-only">
            Walk-Free in numbers
          </h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {FACTS.map(([n, t], i) => (
              <Reveal as="li" key={n + t} delay={i * 0.07}>
                <p className="wf-num wf-serif text-[clamp(40px,5vw,76px)] leading-none">
                  {n}
                </p>
                <p className="mt-3 max-w-[26ch] text-[16px] leading-snug">
                  {t}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- the day ---------- */}
      <div className="pt-16 md:pt-24">
        <div className="wf-wrap">
          <p className="wf-body">
            Below is a small district drawn for this page, run through the same
            steps as the app: sun position for a July day in Austin, building
            and tree shadows projected from it, and every path sampled as shaded
            or in sun. Scroll to move the clock.
          </p>
        </div>
        <DayPlate />
      </div>

      {/* ---------- routes ---------- */}
      <section aria-labelledby="wf-route-h" className="wf-invert wf-section">
        <div className="wf-wrap">
          <div className="grid gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <h2 id="wf-route-h" className="wf-h2">
                Trade a minute <em>for the shade.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-5 lg:pt-3">
              <p className="wf-body">
                Across the six campuses on a July afternoon, shade routes avoid
                13&ndash;25% of the sun for 4&ndash;7% more walking. The
                sun-aversion slider (1 to 6, default 3) sets how many metres of
                shade one metre of sun is worth.
              </p>
            </Reveal>
          </div>
          <div className="mt-14">
            <RouteDuel />
          </div>
          <div className="mt-20">
            <h3 className="wf-h3">Six kinds of walk</h3>
            <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {ROUTE_TYPES.map(([name, d], i) => (
                <Reveal
                  as="li"
                  key={name}
                  delay={i * 0.05}
                  className="bg-(--wf-paper-2) p-5"
                >
                  <p className="text-[18px] font-semibold">{name}</p>
                  {d && (
                    <p className="mt-1 text-[16px] text-(--wf-ink-soft)">{d}</p>
                  )}
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- plant a row ---------- */}
      <section aria-labelledby="wf-plant-h" className="wf-section">
        <div className="wf-wrap">
          <div className="grid gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <h2 id="wf-plant-h" className="wf-h2">
                Plant a row, <em>watch it cool.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-5 lg:pt-3">
              <p className="wf-body">
                The design studio lines a street with trees and shows shade
                share and feels-like before and after, for the street and the
                whole area. One button writes it up as a one-page proposal;
                another downloads the street heat as CSV for planners.
              </p>
            </Reveal>
          </div>
          <div className="mt-14">
            <PlantRow />
          </div>
        </div>
      </section>

      {/* ---------- canopy ---------- */}
      <section
        aria-labelledby="wf-canopy-h"
        className="wf-section bg-(--wf-paper-2)"
      >
        <div className="wf-wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <h2 id="wf-canopy-h" className="wf-h2">
                Trees no one <em>mapped.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="wf-body mt-8">
                Volunteers map street trees, not back gardens or creek banks.
                Walk-Free reads Meta and WRI&rsquo;s 1 m Canopy Height Maps (v2,
                built with DINOv3) on the server, by byte range from
                cloud-optimised GeoTIFFs. A 9 m cell becomes a crown when at
                least 45% of it stands 3 m or taller.
              </p>
              <p className="wf-body mt-5">
                At UC Berkeley that turns about 216 mapped trees into roughly
                11,100. Drag the divider to compare.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <CanopyReveal />
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section aria-labelledby="wf-how-h" className="wf-invert wf-section">
        <div className="wf-wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <h2 id="wf-how-h" className="wf-h2">
                Measured, <em>then walked.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="wf-body mt-8">
                Every number in the app comes from open data, recomputed for the
                hour you choose. Feels-like is labelled as an estimate, not a
                measurement. If one weather source is down, the next one
                answers; if the walking graph has a gap, quick walks fall back
                to OSRM, then Valhalla, then a labelled straight-line estimate.
              </p>
            </Reveal>
            <AskTrace />
          </div>
          <Reveal className="lg:col-span-6 lg:col-start-7">
            <div className="wf-slip">
              <p className="wf-serif text-[28px]">Itinerary for one walk</p>
              {PIPELINE.map((g) => (
                <div key={g.stage} className="mt-7">
                  <h3 className="text-[16px] font-bold">{g.stage}</h3>
                  <dl className="mt-1">
                    {g.rows.map(([k, v]) => (
                      <div key={k} className="wf-leader">
                        <dt>{k}</dt>
                        <dd className="shrink-0 text-(--wf-ink-soft)">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              <p className="-mx-7 mt-8 bg-(--wf-ink) px-7 py-3 text-[16px] font-semibold text-(--wf-paper)">
                Result: the walk, coloured by heat, with minutes in sun
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- cities ---------- */}
      <section aria-labelledby="wf-city-h" className="wf-section">
        <div className="wf-wrap">
          <div className="grid gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <h2 id="wf-city-h" className="wf-h2">
                Seven invented cities, <em>seven weathers.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-5 lg:pt-3">
              <p className="wf-body">
                Describe any city and the assistant plans districts, sixteen
                kinds of landmark, street names, climate and sky. A
                deterministic builder makes it walkable in under 200 ms, with
                walkers who thin out at night and drift toward shade in the
                heat.
              </p>
            </Reveal>
          </div>
          <Playing className="mt-14">
            <Postcards />
          </Playing>
        </div>
      </section>

      {/* ---------- real screens ---------- */}
      <section
        aria-labelledby="wf-shots-h"
        className="wf-section bg-(--wf-paper-2)"
      >
        <div className="wf-wrap">
          <Reveal>
            <h2 id="wf-shots-h" className="wf-h2">
              From the <em>real app.</em>
            </h2>
          </Reveal>
          <ul className="mt-14 grid gap-3 md:grid-cols-12">
            {SHOTS.gallery.map((s, i) => (
              <Reveal
                as="li"
                key={s.src}
                delay={(i % 2) * 0.08}
                className={GALLERY_CELLS[i]}
              >
                <figure className="flex h-full flex-col">
                  <div className="wf-shot relative flex-1 overflow-hidden bg-(--wf-paper-3)">
                    <Image
                      src={s.src}
                      width={s.width}
                      height={s.height}
                      alt={s.alt}
                      sizes={
                        s.height > s.width
                          ? "(min-width: 768px) 32vw, 100vw"
                          : i === 2
                            ? "100vw"
                            : "(min-width: 768px) 58vw, 100vw"
                      }
                      className={`w-full object-cover object-top ${s.height > s.width ? "max-h-[80svh] md:absolute md:inset-0 md:h-full md:max-h-none" : "h-auto"}`}
                    />
                  </div>
                  <figcaption
                    className={`grid gap-1 px-4 py-3 text-[14px] ${i % 2 ? "bg-(--wf-ink) text-(--wf-paper)" : "bg-(--wf-gold) text-(--wf-on-gold)"}`}
                  >
                    <span className="flex justify-between gap-4 font-semibold">
                      <span>{s.what}</span>
                      <span>{s.place}</span>
                    </span>
                    <span>{s.note}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- built with + close ---------- */}
      <section aria-labelledby="wf-built-h" className="wf-section">
        <div className="wf-wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="wf-built-h" className="wf-h3">
              What it&rsquo;s made of
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {STACK.map((s) => (
                <li key={s} className="bg-(--wf-paper-2) px-3 py-2 text-[15px]">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="wf-body grid gap-5 lg:col-span-6 lg:col-start-7">
            <p>
              Four interface styles: Editorial, Night, Sunlight (high contrast
              for glare) and Blueprint, in °F or °C. The walking view follows
              you on a flat north-up map with next-turn banners like &ldquo;In
              shade for 120 m&rdquo;, and can speak the guidance.
            </p>
            <p>
              Installable as an offline PWA, with Capacitor projects for iOS and
              Android (not yet tested on devices). About sixty test files cover
              the model, routing and tools.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="wf-close-h" className="wf-invert">
        <div className="wf-wrap flex min-h-[70svh] flex-col justify-end gap-8 py-20 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="wf-close-h" className="wf-h1 max-w-[9ch]">
            Take the <em>shady side.</em>
          </h2>
          <div className="max-w-[40ch]">
            <p className="wf-body">
              The guided demo opens UT Austin and walks through a shade route in
              about a minute. No account needed.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={LINKS.demo} {...ext} className="wf-btn">
                Try the demo{" "}
                <span className="wf-arrow" aria-hidden="true">
                  ↗
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a href={LINKS.code} {...ext} className="wf-btn wf-btn-ghost">
                Read the code{" "}
                <span className="wf-arrow" aria-hidden="true">
                  ↗
                </span>
                <span className="sr-only"> (opens GitHub in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </ProjectShell>
  );
}

/** "Ask Walk-Free": one question, the real tool names lighting up in order, an illustrative answer. */
function AskTrace() {
  return (
    <Reveal className="wf-trace mt-12">
      <figure className="bg-(--wf-paper-2) p-6">
        <figcaption className="wf-small">
          Ask Walk-Free (an illustrative exchange; the tool names are the
          app&rsquo;s own)
        </figcaption>
        <p className="mt-4 ml-auto w-fit max-w-[30ch] bg-(--wf-ink) px-4 py-3 text-[16px] text-(--wf-paper)">
          Shadiest way from the library to the union at 3?
        </p>
        <ol
          className="mt-5 flex flex-wrap gap-2"
          aria-label="Tools the assistant calls"
        >
          {TOOLS.map((t, i) => (
            <li
              key={t}
              className="wf-chip"
              style={{ "--i": i } as React.CSSProperties}
            >
              {t}
            </li>
          ))}
        </ol>
        <p className="wf-reply mt-5 max-w-[40ch] text-[16px] leading-relaxed">
          The shade route on the map takes a minute longer and keeps you out of
          the sun for most of it. Leaving at 5 would feel cooler still.
        </p>
      </figure>
    </Reveal>
  );
}
