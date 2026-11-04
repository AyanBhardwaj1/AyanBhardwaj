"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { s } from "./styles";

/**
 * "Watch it build": a toy version of YouBank Studio. The agent fills a DCF in
 * reading order, and a three-slide deck reads its numbers from the same model,
 * so moving WACC moves every slide. Illustrative company, illustrative inputs.
 */

const YEARS = ["FY26E", "FY27E", "FY28E", "FY29E", "FY30E"];
const COLS = ["C", "D", "E", "F", "G"];
const BASE_REV = 1000; // $M, FY25A
const GROWTH = [0.24, 0.2, 0.17, 0.14, 0.11];
const MARGIN = [0.08, 0.11, 0.14, 0.16, 0.18];
const TAX = 0.21;
const TG = 0.03;

function model(wacc: number) {
  const rev: number[] = [];
  let prev = BASE_REV;
  for (const g of GROWTH) {
    prev = prev * (1 + g);
    rev.push(prev);
  }
  const ebit = rev.map((r, i) => r * MARGIN[i]);
  const taxes = ebit.map((e) => -e * TAX);
  const nopat = ebit.map((e, i) => e + taxes[i]);
  const da = rev.map((r) => r * 0.04);
  const capex = rev.map((r) => -r * 0.05);
  const nwc = rev.map((r, i) => -(r - (i ? rev[i - 1] : BASE_REV)) * 0.1);
  const fcf = nopat.map((n, i) => n + da[i] + capex[i] + nwc[i]);
  const df = fcf.map((_, i) => 1 / Math.pow(1 + wacc, i + 1));
  const pv = fcf.map((f, i) => f * df[i]);
  const sumPv = pv.reduce((a, b) => a + b, 0);
  const tv = (fcf[4] * (1 + TG)) / (wacc - TG);
  const pvTv = tv * df[4];
  const ev = sumPv + pvTv;
  const rows: { label: string; fmt: "m" | "pct" | "x"; v: number[] }[] = [
    { label: "Revenue", fmt: "m", v: rev },
    { label: "Growth", fmt: "pct", v: GROWTH },
    { label: "EBIT margin", fmt: "pct", v: MARGIN },
    { label: "EBIT", fmt: "m", v: ebit },
    { label: "Taxes", fmt: "m", v: taxes },
    { label: "NOPAT", fmt: "m", v: nopat },
    { label: "D&A", fmt: "m", v: da },
    { label: "Capex", fmt: "m", v: capex },
    { label: "Change in NWC", fmt: "m", v: nwc },
    { label: "Unlevered FCF", fmt: "m", v: fcf },
    { label: "Discount factor", fmt: "x", v: df },
    { label: "PV of FCF", fmt: "m", v: pv },
  ];
  return { rows, fcf, sumPv, pvTv, ev };
}

const fmt = (v: number, f: "m" | "pct" | "x") =>
  f === "pct"
    ? `${(v * 100).toFixed(1)}%`
    : f === "x"
      ? v.toFixed(3)
      : v < 0
        ? `(${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })})`
        : v.toLocaleString("en-US", { maximumFractionDigits: 0 });

const money = (v: number) =>
  `$${(v / 1000).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}B`;

const TOTAL = 12 * 5;
const WACC_DEPENDENT = new Set([10, 11]); // discount factor, PV rows

export function StudioBuild() {
  const [wacc, setWacc] = useState(0.095);
  const [filled, setFilled] = useState(TOTAL); // server render: finished model
  const [flash, setFlash] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const started = useRef(false);

  const m = useMemo(() => model(wacc), [wacc]);
  const done = filled >= TOTAL;

  const clear = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  };

  const run = () => {
    clear();
    if (root.current) delete root.current.dataset.pending;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFilled(TOTAL);
      return;
    }
    setFilled(0);
    timer.current = window.setInterval(() => {
      setFilled((f) => {
        if (f + 1 >= TOTAL) clear();
        return Math.min(TOTAL, f + 1);
      });
    }, 55);
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Hide the server-rendered finished model until the build starts on screen.
    el.dataset.pending = "";
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          run();
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cursor = done ? null : filled;
  const addr =
    cursor === null
      ? null
      : `DCF!${COLS[cursor % 5]}${5 + Math.floor(cursor / 5)}`;

  const sens = [0.08, 0.09, 0.1, 0.11, 0.12].map((w) => ({
    w,
    ev: model(w).ev,
  }));
  const sensMax = Math.max(...sens.map((x) => x.ev));
  const fcfMax = Math.max(...m.fcf);

  return (
    <div ref={root} className={s.panel} data-ui="">
      <div className={s.panelBar}>
        <span>
          <span className={s.amber}>STUDIO</span> · Example Co. · DCF.xlsx +
          Pitch.pptx
        </span>
        <span aria-live="polite" className={s.muted}>
          {addr ? (
            <>
              Writing <span className={s.amber}>{addr}</span>
            </>
          ) : (
            "Run complete"
          )}
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 overflow-x-auto p-3 md:p-4">
          <table className={s.sheet}>
            <caption className="sr-only">
              Illustrative discounted cash flow model, millions of dollars, WACC{" "}
              {(wacc * 100).toFixed(1)}%
            </caption>
            <thead>
              <tr>
                <th scope="col" className={s.rowHead}>
                  $M
                </th>
                {YEARS.map((y, i) => (
                  <th key={y} scope="col">
                    <span className={s.colLetter} aria-hidden="true">
                      {COLS[i]}
                    </span>
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.rows.map((r, ri) => (
                <tr key={r.label} className={ri === 9 ? s.totalRow : undefined}>
                  <th scope="row" className={s.rowHead}>
                    <span className={s.rowNum} aria-hidden="true">
                      {5 + ri}
                    </span>
                    {r.label}
                  </th>
                  {r.v.map((v, ci) => {
                    const idx = ri * 5 + ci;
                    const isOn = idx < filled;
                    const isCursor = idx === cursor;
                    return (
                      <td
                        key={WACC_DEPENDENT.has(ri) ? `${ci}-${flash}` : ci}
                        className={[
                          isOn ? s.cellOn : s.cellOff,
                          isCursor ? s.cellCursor : "",
                          isOn && flash && WACC_DEPENDENT.has(ri)
                            ? s.cellFlash
                            : "",
                        ].join(" ")}
                      >
                        {isCursor && (
                          <span className={s.agentTag} aria-hidden="true">
                            Agent
                          </span>
                        )}
                        {isOn ? fmt(v, r.fmt) : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <label className={s.sliderLabel}>
              <span>
                WACC <span className={s.amber}>{(wacc * 100).toFixed(1)}%</span>
              </span>
              <input
                type="range"
                min={7}
                max={12}
                step={0.5}
                value={wacc * 100}
                onChange={(e) => {
                  setWacc(Number(e.target.value) / 100);
                  setFlash((f) => f + 1);
                }}
                className={s.slider}
              />
            </label>
            <button
              type="button"
              className={s.btnGhost}
              onClick={() => (done ? run() : setFilled(TOTAL))}
            >
              {done ? "Undo this run and rebuild" : "Skip to the end"}
            </button>
          </div>
        </div>

        <div className={s.deck} aria-label="Linked deck" role="group">
          <div className={s.slide}>
            <p className={s.slideKicker}>Slide 4 · Valuation summary</p>
            <p className={s.slideBig}>{money(m.ev)}</p>
            <p className={s.slideSub}>
              Enterprise value at {(wacc * 100).toFixed(1)}% WACC, 3% terminal
              growth. Terminal value is {Math.round((m.pvTv / m.ev) * 100)}% of
              it.
            </p>
          </div>
          <div className={s.slide}>
            <p className={s.slideKicker}>Slide 5 · WACC sensitivity</p>
            <ul className={s.bars} aria-label="Enterprise value by WACC">
              {sens.map((x) => (
                <li key={x.w}>
                  <span className={s.barLabel}>{(x.w * 100).toFixed(0)}%</span>
                  <span className={s.barTrack}>
                    <span
                      className={
                        Math.abs(x.w - wacc) < 0.0026 ? s.barFillOn : s.barFill
                      }
                      style={{
                        width: `${((x.ev / sensMax) * 100).toFixed(2)}%`,
                      }}
                    />
                  </span>
                  <span className={s.barValue}>{money(x.ev)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={s.slide}>
            <p className={s.slideKicker}>Slide 6 · Free cash flow build</p>
            <div className={s.cols} aria-hidden="true">
              {m.fcf.map((f, i) => (
                <span
                  key={YEARS[i]}
                  style={{ height: `${((f / fcfMax) * 100).toFixed(2)}%` }}
                >
                  <em>{YEARS[i].slice(2, 4)}</em>
                </span>
              ))}
            </div>
            <p className="sr-only">
              Free cash flow rises from {fmt(m.fcf[0], "m")} to{" "}
              {fmt(m.fcf[4], "m")} million dollars.
            </p>
          </div>
        </div>
      </div>

      <div className={done ? s.auditOn : s.auditOff} aria-live="polite">
        {done ? (
          <>
            <span className={s.pos}>▲ Audit</span> 60 cells written · 0 errors ·
            0 hard-codes in the forecast · deck ties to model
          </>
        ) : (
          <>Building the model… {filled} of 60 cells</>
        )}
      </div>
    </div>
  );
}
