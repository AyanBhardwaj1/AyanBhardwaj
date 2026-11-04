"use client";

import { useEffect, useRef, useState } from "react";
import { ledName, SourcePicker, useLight, type Src } from "./light";

/**
 * The 10-channel AS7341 readout under the band's white LED, like the
 * monitor's Spectrum view. A simplified illustrative skin model (not the
 * project's simulator): redness deepens the haemoglobin dip in green and
 * yellow, hydration lowers the return a little, most in the NIR. Each bar is
 * drawn in its filter's colour and labelled by wavelength. Under one of the
 * narrow LEDs only the channel nearest its wavelength gets meaningful light
 * (F8 for 660 nm, NIR for 850 nm); the full spectrum needs the white LED.
 */

const BANDS = [
  { id: "F1", nm: "415", color: "#8a5cf6" },
  { id: "F2", nm: "445", color: "#4c6ef5" },
  { id: "F3", nm: "480", color: "#22b8cf" },
  { id: "F4", nm: "515", color: "#40c057" },
  { id: "F5", nm: "555", color: "#94d82d" },
  { id: "F6", nm: "590", color: "#fcc419" },
  { id: "F7", nm: "630", color: "#fd7e14" },
  { id: "F8", nm: "680", color: "#f03e3e" },
  { id: "Clear", nm: "Clear", color: "#adb5bd" },
  { id: "NIR", nm: "NIR", color: "#c2506a" },
];
const BASE = [0.17, 0.19, 0.23, 0.26, 0.25, 0.35, 0.47, 0.53, 0.33, 0.57];
const HB = [0.25, 0.12, 0.06, 0.22, 0.35, 0.3, 0.05, 0.02, 0.12, 0];
const ROOM = [0.06, 0.12, 0.1, 0.16, 0.22, 0.26, 0.2, 0.12, 0.6, 0.05];
const MAX = 0.7;
/** The channel each narrow LED lands in, by index into BANDS. */
const LIT: Record<Src, number | null> = { white: null, "660": 7, "850": 9 };
/** White light is read off the Clear channel (index 8). */
export const channelFor = (s: Src) => LIT[s] ?? 8;
export const baseReturn = (s: Src) => BASE[channelFor(s)];

function model(hyd: number, red: number, contact: boolean) {
  if (!contact) return ROOM.slice();
  return BASE.map((b, i) => {
    const h = 1 - (i === 9 ? 0.16 : 0.07) * (hyd - 0.5) * 2;
    const r = 1 - HB[i] * red;
    return Math.max(0.01, b * h * r);
  });
}

export function Spectrum() {
  const [hyd, setHyd] = useState(55);
  const [red, setRed] = useState(20);
  const [contact, setContact] = useState(true);
  const [src, setSrc] = useLight("white");
  const lit = contact ? LIT[src] : null;
  const shows = (i: number) => lit === null || lit === i;
  const [noise, setNoise] = useState<number[]>(() => BANDS.map(() => 0));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id = 0;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting)
        id = window.setInterval(
          () => setNoise(BANDS.map(() => (Math.random() - 0.5) * 0.012)),
          180,
        );
    });
    if (ref.current) io.observe(ref.current);
    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, []);

  const R = model(hyd / 100, red / 100, contact).map((v, i) =>
    Math.max(0.005, v + noise[i]),
  );
  const exact = model(hyd / 100, red / 100, contact);
  const mi = 100 * Math.log10(1 / exact[7]);
  const ei = 100 * (Math.log10(1 / exact[4]) - Math.log10(1 / exact[7]));

  return (
    <div ref={ref} className="os-screen">
      <div className="os-screen-bar">
        <span className="os-live">
          Spectrum · {src === "white" ? "white" : `${src} nm`} LED ·
          illustrative model
        </span>
        <span className={contact ? "" : "text-(--os-alert)"}>
          {contact ? "contact OK" : "NO_CONTACT"}
        </span>
      </div>
      <div className="p-4 sm:p-6">
        <svg
          viewBox="0 0 600 300"
          className="block h-auto w-full"
          aria-hidden="true"
        >
          {[0.2, 0.4, 0.6].map((g) => (
            <g key={g}>
              <line
                x1="34"
                x2="600"
                y1={260 - (g / MAX) * 240}
                y2={260 - (g / MAX) * 240}
                stroke="var(--os-grid)"
                strokeWidth="1"
              />
              <text
                x="0"
                y={264 - (g / MAX) * 240}
                fontSize="15"
                className="os-mono"
                fill="var(--os-ink-soft)"
              >
                {g * 100}%
              </text>
            </g>
          ))}
          {BANDS.map((b, i) => {
            const x = 44 + i * 55.5;
            const on = shows(i);
            const h = on ? (Math.min(MAX, R[i]) / MAX) * 240 : 3;
            return (
              <g key={b.id}>
                <rect
                  x={x}
                  y={20}
                  width="40"
                  height="240"
                  fill="var(--os-sunken)"
                  rx="3"
                />
                <rect
                  x={x}
                  y={20}
                  width="40"
                  height="240"
                  rx="3"
                  fill={b.color}
                  fillOpacity={on ? 1 : 0.35}
                  className="os-spec-bar"
                  style={{
                    transform: `scaleY(${h / 240})`,
                    transformOrigin: `0 260px`,
                  }}
                />
                <text
                  x={x + 20}
                  y="284"
                  textAnchor="middle"
                  fontSize="15"
                  className="os-mono"
                  fill="var(--os-ink)"
                >
                  {b.nm}
                </text>
                <text
                  x={x + 20}
                  y={Math.max(36, 254 - h)}
                  textAnchor="middle"
                  fontSize="15"
                  className="os-mono"
                  fill="var(--os-ink)"
                >
                  {on ? Math.round(exact[i] * 100) : ""}
                </text>
              </g>
            );
          })}
        </svg>
        <table className="sr-only">
          <caption>
            Reflectance by AS7341 channel under the {ledName(src)} LED, percent
          </caption>
          <thead>
            <tr>
              <th scope="col">Channel</th>
              <th scope="col">Reflectance</th>
            </tr>
          </thead>
          <tbody>
            {BANDS.map((b, i) => (
              <tr key={b.id}>
                <th scope="row">
                  {b.nm === b.id ? b.id : `${b.id}, ${b.nm} nm`}
                </th>
                <td>
                  {shows(i) ? `${Math.round(exact[i] * 100)}%` : "no light"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="os-hyd"
              className="flex justify-between text-[15px] font-semibold"
            >
              Hydration <span className="os-mono font-normal">{hyd}%</span>
            </label>
            <input
              id="os-hyd"
              type="range"
              className="os-range"
              min={0}
              max={100}
              value={hyd}
              onChange={(e) => setHyd(Number(e.target.value))}
            />
          </div>
          <div>
            <label
              htmlFor="os-red"
              className="flex justify-between text-[15px] font-semibold"
            >
              Redness <span className="os-mono font-normal">{red}%</span>
            </label>
            <input
              id="os-red"
              type="range"
              className="os-range"
              min={0}
              max={100}
              value={red}
              onChange={(e) => setRed(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="os-readout">LED</span>
          <SourcePicker
            value={src}
            onChange={setSrc}
            label="LED for the spectrum"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-semibold">
            <input
              type="checkbox"
              checked={contact}
              onChange={(e) => setContact(e.target.checked)}
              className="size-5 accent-(--os-teal)"
            />
            Band touching skin
          </label>
          <p className="os-readout" aria-live="polite">
            {!contact
              ? "no contact: the sensor sees room light"
              : src === "white"
                ? `melanin index ${mi.toFixed(0)} · erythema index ${ei.toFixed(0)}`
                : `${src} nm lands in ${src === "850" ? "NIR" : "F8"} only · melanin and erythema need white`}
          </p>
        </div>
      </div>
    </div>
  );
}
