import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import {
  ProjectName,
  ProjectShell,
} from "@/components/project-page/ProjectShell";
import { NetProbe } from "@/components/projects/oncosense/NetProbe";
import { Scope } from "@/components/projects/oncosense/Scope";
import { SkinLight } from "@/components/projects/oncosense/SkinLight";
import { Spectrum } from "@/components/projects/oncosense/Spectrum";
import "@/components/projects/oncosense/oncosense.css";
import { projectMetadata } from "@/lib/projects";
import {
  FIXES,
  LINKS,
  MODES,
  PHOTOS,
  ROADMAP,
  SCREENS,
  SPECS,
  STACK,
} from "./data";

export const metadata = projectMetadata("oncosense", {
  title: "OncoSense: a wearable that reads light back from skin",
  description:
    "A wearable optical band built in person at MIT Lincoln Laboratory with Eric Niu: red and near-infrared light into the skin, a 10-channel spectral sensor, and a tiny on-band neural network, with a browser monitor. Research prototype, not a medical device.",
});

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

function Photo({
  p,
  sizes,
  className = "",
  priority = false,
}: {
  p: {
    src: string;
    width: number;
    height: number;
    alt: string;
    caption: string;
  };
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={className}>
      <div className="os-photo overflow-hidden rounded-[10px] bg-(--os-sunken)">
        <Image
          src={p.src}
          width={p.width}
          height={p.height}
          alt={p.alt}
          sizes={sizes}
          priority={priority}
          className="h-full w-full object-cover"
        />
      </div>
      <figcaption className="os-small mt-3">{p.caption}</figcaption>
    </figure>
  );
}

function Warning() {
  return (
    <p className="os-label">
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <path d="M10 2 19 18H1Z" fill="currentColor" />
        <path
          d="M10 8v4.5M10 14.6v.4"
          stroke="var(--os-warn)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      Research prototype, not a medical device
    </p>
  );
}

export default function Page() {
  return (
    <ProjectShell slug="oncosense" className="os">
      {/* ---------- hero ---------- */}
      <section
        aria-labelledby="project-title"
        className="os-wrap grid gap-12 pt-12 pb-20 md:pt-16 lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-28"
      >
        <div className="lg:col-span-5">
          <Warning />
          <ProjectName slug="oncosense" className="os-h1 mt-8">
            OncoSense
          </ProjectName>
          <p className="os-statement mt-7">
            A wearable band that shines red and near-infrared light into skin
            and reads what comes back.
          </p>
          <p className="os-body mt-5">
            Built in person at MIT Lincoln Laboratory with Eric Niu, and
            presented to an audience at MIT. A 10-channel spectral sensor reads
            the returned light; a neural network of about 480 parameters on the
            band reads skin state; a browser monitor shows it live.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={LINKS.monitor} {...ext} className="os-btn">
              Open the virtual band{" "}
              <span className="os-arrow" aria-hidden="true">
                ↗
              </span>
              <span className="sr-only">
                {" "}
                (opens the OncoSense Monitor in a new tab)
              </span>
            </a>
            <a href={LINKS.code} {...ext} className="os-btn os-btn-ghost">
              Code{" "}
              <span className="os-arrow" aria-hidden="true">
                ↗
              </span>
              <span className="sr-only"> (opens GitHub in a new tab)</span>
            </a>
          </div>
        </div>
        <div className="lg:col-span-7">
          <SkinLight />
        </div>
      </section>

      {/* ---------- the band ---------- */}
      <section
        aria-labelledby="os-band-h"
        className="os-ch os-ch-panel os-section"
      >
        <div className="os-wrap">
          <div className="grid gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-6">
              <h2 id="os-band-h" className="os-h2">
                From graph paper to the arm
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-5 lg:col-start-8">
              <p className="os-body">
                The inner face of the band holds two LEDs and a spectral sensor
                side by side, so light goes in, scatters through the skin and
                comes back out a few millimetres away. The outer face carries
                the microcontroller and the battery.
              </p>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-12">
            <Reveal className="md:col-span-4">
              <Photo p={PHOTOS.sketch} sizes="(min-width: 768px) 30vw, 100vw" />
            </Reveal>
            <Reveal delay={0.08} className="md:col-span-8">
              <Photo p={PHOTOS.worn} sizes="(min-width: 768px) 62vw, 100vw" />
            </Reveal>
            <Reveal className="md:col-span-7">
              <Photo p={PHOTOS.head} sizes="(min-width: 768px) 55vw, 100vw" />
            </Reveal>
            <Reveal delay={0.08} className="md:col-span-5">
              <dl className="grid gap-5 rounded-[10px] bg-(--os-ground) p-6">
                {SPECS.map(([k, v]) => (
                  <div key={k}>
                    <dt className="os-readout">{k}</dt>
                    <dd className="mt-1 text-[16px] leading-snug">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- the pivot ---------- */}
      <section
        aria-labelledby="os-pivot-h"
        className="os-ch os-ch-wash os-section"
      >
        <div className="os-wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <h2 id="os-pivot-h" className="os-h2">
                Lasers out, LEDs in
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <Photo
                p={PHOTOS.inside}
                sizes="(min-width: 1024px) 30vw, 100vw"
                className="mt-10 max-w-[360px]"
              />
            </Reveal>
          </div>
          <ol className="grid gap-10 lg:col-span-6 lg:col-start-7">
            {[
              {
                note: "hypothesis",
                body: "The work began in nonlinear optics: second-harmonic generation from collagen, a possible marker for tumours.",
              },
              {
                note: "review",
                body: "Dr. Yuzhe Xiao and Jack Hasty of UNT’s Applied Physics Research Group confirmed that second-harmonic generation needs femtosecond lasers, far beyond anything a wearable can carry.",
              },
              {
                note: "pivot",
                body: "So the team moved to linear optics that LEDs can drive: diffuse reflectance and photoluminescence, aimed first at skin hydration, where the literature reports r ≈ 0.93 against corneometers. Hydration is the stepping stone back toward screening.",
              },
              {
                note: "scale",
                body: "AFFOA advised on turning the band into a textile wearable. The groundwork is an eight-page literature review.",
              },
            ].map((s, i) => (
              <Reveal
                as="li"
                key={s.note}
                delay={i * 0.06}
                className="grid gap-2 sm:grid-cols-[140px_1fr] sm:gap-6"
              >
                <p className="os-note">{s.note}</p>
                <p className="os-body">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- spectrum ---------- */}
      <section aria-labelledby="os-spec-h" className="os-ch os-section">
        <div className="os-wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 id="os-spec-h" className="os-h2">
                Ten bands back
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="os-body mt-8">
                The AS7341 splits the returned light into eight visible bands
                from 415 to 680 nm, plus Clear and near-infrared. The band reads
                it four ways:
              </p>
              <dl className="mt-6 grid gap-4">
                {MODES.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[17px] font-bold">{k}</dt>
                    <dd className="mt-1 text-[16px] leading-snug text-(--os-ink-soft)">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
          <div className="lg:col-span-8">
            <Spectrum />
            <p className="os-small mt-3">
              Drag the sliders to reshape the spectrum. The model here is
              simplified for this page; the monitor runs a JavaScript port of
              the project&rsquo;s physics-informed simulator.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- scope ---------- */}
      <section
        aria-labelledby="os-scope-h"
        className="os-ch os-ch-panel os-section"
      >
        <div className="os-wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:order-2 lg:col-span-4 lg:col-start-9">
            <Reveal>
              <h2 id="os-scope-h" className="os-h2">
                Room light, subtracted
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="os-body mt-8">
                Firmware v2 reads every sample with the LED off, then on, and
                keeps the difference. Four on/off pairs are averaged with a
                trimmed mean at 50 ms integration. A lamp flickering overhead
                moves both readings together, so the difference holds still.
              </p>
              <p className="os-body mt-5">
                Switch off the differential read to see what the first version
                saw. Then lift the band, or flood it with light, and watch the
                flags.
              </p>
            </Reveal>
          </div>
          <div className="lg:order-1 lg:col-span-8">
            <Scope />
          </div>
        </div>
      </section>

      {/* ---------- fault -> fix ---------- */}
      <section aria-labelledby="os-fix-h" className="os-ch os-section">
        <div className="os-wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 id="os-fix-h" className="os-h2">
                v1 faults, v2 fixes
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="os-body mt-8">
                The summer prototype was comfortable and light-tight, and it
                detected hydration differences in most trials: about 65% overall
                success. Calibration drifted between sessions. The causes were
                traced to ambient light, saturation and fixed thresholds, and
                the firmware was rebuilt around them.
              </p>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-8">
            <div className="os-screen overflow-x-auto">
              <table className="os-table">
                <caption className="sr-only">
                  Faults in firmware v1 and how v2 fixes each one
                </caption>
                <thead>
                  <tr>
                    <th scope="col">v1 fault</th>
                    <th scope="col">v2 fix</th>
                  </tr>
                </thead>
                <tbody>
                  {FIXES.map((f) => (
                    <tr key={f.fault}>
                      <td>
                        <span
                          className="os-lamp bg-(--os-alert)"
                          aria-hidden="true"
                        />
                        {f.fault}
                      </td>
                      <td>
                        <span
                          className="os-lamp bg-(--os-teal)"
                          aria-hidden="true"
                        />
                        {f.fix}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="os-small mt-4">
              Firmware v2 is modular C++ with a host-tested skin model and a
              firmware-in-the-loop hardware simulator; CI runs the unit tests,
              compiles the firmware and does a quick training run.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- neural net ---------- */}
      <section
        aria-labelledby="os-nn-h"
        className="os-ch os-ch-wash os-section"
      >
        <div className="os-wrap">
          <div className="grid gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <h2 id="os-nn-h" className="os-h2">
                A network small enough to wear
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-5">
              <p className="os-body">
                Firmware v3 scans under all three light sources, turns the
                result into 12 features and runs a 12→16→12→5 network: about 480
                parameters, about 2 KB of flash, hand-written float inference in
                under a millisecond on the SAMD21.
              </p>
            </Reveal>
          </div>
          <div className="mt-14">
            <NetProbe />
          </div>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            <Reveal>
              <h3 className="os-h3">Trained on virtual skin</h3>
              <p className="os-body mt-3 text-[17px]!">
                A pure-numpy trainer learns from a physics-informed skin-optics
                simulator: melanin, blood, scattering, hydration, occlusive
                film, illumination, contact and noise, for 400 virtual people in
                40 states each.
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <h3 className="os-h3">75.2% on people it never saw</h3>
              <p className="os-body mt-3 text-[17px]!">
                Held out by whole person: 80 unseen virtual people, 3,200
                readings. That number measures the simulator, not real skin.
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <h3 className="os-h3">Taught on the band</h3>
              <p className="os-body mt-3 text-[17px]!">
                &ldquo;Teach the network&rdquo; takes three scans and re-fits
                only the output layer by SGD on the device, pulled toward the
                factory weights. It is saved to flash and survives power-off.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- monitor ---------- */}
      <section
        aria-labelledby="os-mon-h"
        className="os-ch os-ch-panel os-section"
      >
        <div className="os-wrap">
          <div className="grid gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-6">
              <h2 id="os-mon-h" className="os-h2">
                The monitor, in a browser tab
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-5 lg:col-start-8">
              <p className="os-body">
                Plain HTML, CSS and JavaScript modules. It talks to a real band
                over Web Serial in Chrome or Edge, or runs a virtual band with
                the same protocol, the same simulator and the same network
                weights. Guided calibration, Teach the network, session
                recording to CSV or JSON, a device log; installable and offline.
              </p>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            <Reveal className="md:col-span-2">
              <Photo p={SCREENS[0]} sizes="100vw" />
            </Reveal>
            <Reveal>
              <Photo p={SCREENS[1]} sizes="(min-width: 768px) 48vw, 100vw" />
            </Reveal>
            <Reveal delay={0.08}>
              <Photo p={SCREENS[2]} sizes="(min-width: 768px) 48vw, 100vw" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- next ---------- */}
      <section aria-labelledby="os-next-h" className="os-ch os-section">
        <div className="os-wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="os-next-h" className="os-h2">
              What comes next
            </h2>
            <p className="os-body mt-8">
              Validation against a corneometer, with targets set in advance:
              coefficient of variation under 5%, Cohen&rsquo;s d above 2, and
              correlation above 0.8.
            </p>
          </div>
          <div className="grid gap-10 lg:col-span-6 lg:col-start-7">
            <div>
              <h3 className="os-h3">On the roadmap</h3>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {ROADMAP.map((r) => (
                  <li
                    key={r}
                    className="rounded-[6px] bg-(--os-sunken) px-4 py-3 text-[16px]"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="os-h3">Built with</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {STACK.map((s) => (
                  <li
                    key={s}
                    className="os-readout rounded-[6px] bg-(--os-sunken) px-3 py-2 text-(--os-ink)!"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="os-close-h" className="os-ch os-ch-dark">
        <div className="os-wrap flex min-h-[64svh] flex-col justify-end gap-8 py-20 lg:flex-row lg:items-end lg:justify-between">
          <h2
            id="os-close-h"
            className="os-h2 max-w-[12ch] text-(--os-teal) lg:text-[clamp(56px,6.4vw,104px)]"
          >
            Try the virtual band
          </h2>
          <div className="max-w-[42ch]">
            <Warning />
            <p className="os-body mt-6">
              The monitor runs a virtual band in any browser, with no sign-in.
              Press &ldquo;Try the virtual band&rdquo;, capture a baseline, and
              take an AI reading.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={LINKS.monitor} {...ext} className="os-btn">
                Open the monitor{" "}
                <span className="os-arrow" aria-hidden="true">
                  ↗
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a href={LINKS.code} {...ext} className="os-btn os-btn-ghost">
                Read the code{" "}
                <span className="os-arrow" aria-hidden="true">
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
