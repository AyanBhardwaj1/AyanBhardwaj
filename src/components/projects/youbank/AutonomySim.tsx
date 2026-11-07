"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AUTOPILOT, betaPdf, engineState, mulberry32 } from "./beta";
import { s } from "./styles";

type Kind = "unchanged" | "typo" | "number" | "rewrite";

const KINDS: Record<
  Kind,
  { label: string; good: boolean; ratio: number; why: string }
> = {
  unchanged: {
    label: "Sent unchanged",
    good: true,
    ratio: 0,
    why: "edit ratio 0.00",
  },
  typo: {
    label: "Fixed a typo",
    good: true,
    ratio: 0.03,
    why: "edit ratio 0.03, under 0.05",
  },
  number: {
    label: "Changed a number",
    good: false,
    ratio: 0.02,
    why: "a critical field changed",
  },
  rewrite: {
    label: "Rewrote it",
    good: false,
    ratio: 0.62,
    why: "edit ratio 0.62",
  },
};

type Decision = { id: number; kind: Kind };

const W = 600;
const H = 200;
const X0 = 0.5; // the plot shows the part of [0, 1] that matters
const px = (x: number) => ((x - X0) / (1 - X0)) * W;
const pct = (x: number) => `${Math.round(x * 100)}%`;

function curvePath(a: number, b: number) {
  const pts: [number, number][] = [];
  let max = 0;
  for (let i = 0; i <= 120; i++) {
    const x = X0 + ((1 - X0) * i) / 120;
    const y = betaPdf(Math.min(x, 0.9995), a, b);
    pts.push([x, y]);
    if (y > max) max = y;
  }
  const sy = (y: number) => H - 8 - (y / (max || 1)) * (H - 28);
  const line = pts
    .map(
      ([x, y], i) => `${i ? "L" : "M"}${px(x).toFixed(1)} ${sy(y).toFixed(1)}`,
    )
    .join(" ");
  return { line, area: `${line} L${W} ${H} L0 ${H} Z` };
}

/** A person who mostly sends drafts as written, with the odd slip. */
function personScript(): Kind[] {
  const rnd = mulberry32(42);
  const out: Kind[] = [];
  for (let i = 0; i < 40; i++) {
    const r = rnd();
    // Early on the agent is still learning the voice; after that it holds.
    const miss = i < 6 ? 0.2 : 0;
    out.push(
      r < miss / 2
        ? "rewrite"
        : r < miss
          ? "number"
          : r > 0.88
            ? "typo"
            : "unchanged",
    );
  }
  return out;
}

export function AutonomySim() {
  const [log, setLog] = useState<Decision[]>([]);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  const nextId = useRef(1);

  const good = log.filter((d) => KINDS[d.kind].good).length;
  const bad = log.length - good;
  const st = useMemo(() => engineState(good, bad), [good, bad]);
  const curve = useMemo(() => curvePath(st.a, st.b), [st.a, st.b]);

  const root = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const simRef = useRef<() => void>(() => {});

  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
    },
    [],
  );

  // The first time the panel is mostly on screen, a simulated person starts
  // sending drafts, so the curve is already moving when a visitor arrives.
  // Any click of theirs takes over.
  useEffect(() => {
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (!touched.current) simRef.current();
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const add = (kind: Kind) => {
    // Take the id outside the updater: Strict Mode runs updaters twice.
    const id = nextId.current++;
    setLog((l) => [...l, { id, kind }]);
  };

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };

  const reset = () => {
    stop();
    setLog([]);
    nextId.current = 1;
  };

  const simulate = () => {
    stop();
    nextId.current = 1;
    const script = personScript();
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setLog(script.map((kind) => ({ id: nextId.current++, kind })));
      return;
    }
    setLog([]);
    setRunning(true);
    let i = 0;
    timer.current = window.setInterval(() => {
      add(script[i++]);
      if (i >= script.length) stop();
    }, 140);
  };

  useEffect(() => {
    simRef.current = simulate;
  });

  const needed = Math.max(0, AUTOPILOT.minDecisions - st.n);
  const status = st.earned
    ? "Earned autopilot"
    : st.n === 0
      ? "No decisions yet"
      : needed > 0
        ? `Watching: ${needed} more decision${needed === 1 ? "" : "s"} before it can ask`
        : "Not yet: the 90% bound is above 10% edits";

  const recent = log.slice(-6).reverse();

  return (
    <div
      ref={root}
      className={s.panel}
      data-ui=""
      onPointerDown={() => (touched.current = true)}
      onKeyDown={() => (touched.current = true)}
    >
      <div className={s.panelBar}>
        <span>
          <span className={s.amber}>ENGINE</span> · earned autonomy · kind:
          &ldquo;scheduling reply&rdquo;
        </span>
        <span className={st.earned ? s.badgeOn : s.badgeOff} aria-hidden="true">
          {st.earned ? "● AUTOPILOT" : "○ DRAFTS ONLY"}
        </span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
        <div className="p-4 md:p-5">
          <figure className="m-0">
            <svg
              viewBox={`0 0 ${W} ${H + 24}`}
              className="block h-auto w-full"
              role="img"
              aria-label={`Belief about the share of drafts sent unchanged: estimate ${pct(st.mean)}, 90% interval ${pct(st.lo)} to ${pct(st.hi)}. Autopilot bar at 90%.`}
            >
              {[0.5, 0.6, 0.7, 0.8, 0.9, 1].map((t) => (
                <g key={t}>
                  <line
                    x1={px(t)}
                    x2={px(t)}
                    y1={0}
                    y2={H}
                    className={s.gridLine}
                  />
                  {/* Edge labels anchor inward, so "100%" is never clipped. */}
                  <text
                    x={
                      px(t) < 16
                        ? px(t) + 1
                        : px(t) > W - 16
                          ? px(t) - 2
                          : px(t)
                    }
                    y={H + 18}
                    textAnchor={
                      px(t) < 16 ? "start" : px(t) > W - 16 ? "end" : "middle"
                    }
                    className={s.axisText}
                  >
                    {pct(t)}
                  </text>
                </g>
              ))}
              <rect
                x={px(Math.max(st.lo, X0))}
                width={Math.max(0, px(st.hi) - px(Math.max(st.lo, X0)))}
                y={0}
                height={H}
                className={s.band}
              />
              <path d={curve.area} className={s.curveArea} />
              <path d={curve.line} className={s.curveLine} />
              <line x1={px(0.9)} x2={px(0.9)} y1={0} y2={H} className={s.bar} />
              <text
                x={px(0.9) - 6}
                y={16}
                textAnchor="end"
                className={s.barText}
              >
                autopilot bar
              </text>
              {st.n > 0 && st.floor > X0 && (
                <g>
                  <line
                    x1={px(st.floor)}
                    x2={px(st.floor)}
                    y1={22}
                    y2={H}
                    className={st.earned ? s.floorOn : s.floorOff}
                  />
                  <circle
                    cx={px(st.floor)}
                    cy={22}
                    r={4}
                    className={st.earned ? s.dotOn : s.dotOff}
                  />
                </g>
              )}
            </svg>
            <figcaption className={s.caption}>
              Curve: the engine&apos;s belief about how often this kind of draft
              goes out unchanged (Beta posterior, uniform prior). Shaded: 90%
              interval. Dot: the value it is 90% sure the rate is above. It must
              clear the dashed bar.
            </figcaption>
          </figure>

          <div
            className="mt-4 flex flex-wrap gap-2"
            role="group"
            aria-label="Record what you did with the draft"
          >
            {(Object.keys(KINDS) as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  stop();
                  add(k);
                }}
                className={KINDS[k].good ? s.btnGood : s.btnBad}
              >
                <span aria-hidden="true">{KINDS[k].good ? "▲" : "▼"}</span>{" "}
                {KINDS[k].label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={simulate}
              className={s.btnPrimary}
              disabled={running}
            >
              {running ? "Simulating…" : "Simulate a person"}
            </button>
            <button type="button" onClick={reset} className={s.btnGhost}>
              Reset
            </button>
          </div>
        </div>

        <div className={s.side}>
          <p
            className={st.earned ? s.statusOn : s.statusOff}
            aria-live="polite"
          >
            {status}
          </p>
          <dl className={s.stats}>
            <div>
              <dt>Decisions</dt>
              <dd>{st.n}</dd>
            </div>
            <div>
              <dt>Counted good</dt>
              <dd>{good}</dd>
            </div>
            <div>
              <dt>Estimate</dt>
              <dd>{pct(st.mean)}</dd>
            </div>
            <div>
              <dt>90% interval</dt>
              <dd>
                {pct(st.lo)}–{pct(st.hi)}
              </dd>
            </div>
            <div>
              <dt>Would need edits</dt>
              <dd className={st.editBound <= 0.1 ? s.pos : undefined}>
                ≤ {pct(st.editBound)}
              </dd>
            </div>
          </dl>
          <ol className={s.log} aria-label="Most recent decisions">
            {recent.length === 0 && (
              <li className={s.logEmpty}>Each sent draft is a label.</li>
            )}
            {recent.map((d) => (
              <li key={d.id}>
                <span className={KINDS[d.kind].good ? s.pos : s.neg}>
                  {KINDS[d.kind].good ? "▲" : "▼"}
                </span>{" "}
                #{String(d.id).padStart(2, "0")} {KINDS[d.kind].why}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
