"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plan } from "./Plan";
import {
  allExposure,
  feelsLike,
  minutes,
  NODES,
  plen,
  ptsToD,
  route,
  shadowsAt,
  sunStroke,
  type Route,
} from "./world";

const HOUR = 15;

/**
 * Quickest vs More shade on the drawn district at 3 PM. Both routes are
 * computed in the browser with the app's weighting:
 * cost = shade metres + alpha x sun metres.
 */
export function RouteDuel() {
  const [alpha, setAlpha] = useState(3);
  const [show, setShow] = useState<"quick" | "shade">("shade");
  // The highlighted walk draws itself in the first time the plan is on
  // screen, then again on every switch (the path remounts on a new key).
  const [seen, setSeen] = useState(false);
  const plan = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = plan.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const base = useMemo(() => {
    const shadows = shadowsAt(HOUR);
    const exposure = allExposure(shadows);
    const quick = route(exposure, 1);
    return { shadows, exposure, quick, fl: feelsLike(HOUR) };
  }, []);
  const shade = useMemo(() => route(base.exposure, alpha), [base, alpha]);

  const same =
    shade.pts.length === base.quick.pts.length &&
    Math.abs(shade.len - base.quick.len) < 0.5;
  const active = show === "quick" ? base.quick : shade;
  const other = show === "quick" ? shade : base.quick;
  const activeKey = `${show}-${active.len.toFixed(0)}-${active.sunLen.toFixed(0)}`;
  const activeLen = plen(active.pts);

  const s = NODES.n03;
  const f = NODES.n40;

  const sunCut = 1 - shade.sunLen / base.quick.sunLen;
  const extra = shade.len / base.quick.len - 1;

  return (
    <div
      className="wf-duel grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12"
      data-seen={seen ? "" : undefined}
    >
      <div className="lg:col-span-7" ref={plan}>
        <Plan
          id="wf-route-plan"
          shadows={base.shadows}
          exposure={base.exposure}
          sunColor={sunStroke(base.fl.sunlight)}
          dim
          labels={false}
          title="Two walks across the illustrative district at 3 PM"
          desc={`The quickest walk takes ${fmtMin(base.quick)} with ${pct(base.quick)} of it in shade. With sun aversion ${alpha}, the shade route takes ${fmtMin(shade)} with ${pct(shade)} in shade.`}
        >
          <path
            d={ptsToD(other.pts)}
            className="wf-route wf-route-other"
            stroke="var(--wf-ink)"
            strokeOpacity="0.35"
            strokeWidth="9"
            strokeDasharray="1 14"
          />
          <path
            key={activeKey}
            d={ptsToD(active.pts)}
            className="wf-route wf-route-draw"
            stroke={show === "quick" ? "var(--wf-brick)" : "var(--wf-shade)"}
            strokeWidth="13"
            strokeDasharray={activeLen}
            style={{ "--len": activeLen } as React.CSSProperties}
          />
          <g aria-hidden="true">
            <circle cx={s.x} cy={s.y} r="20" className="p-pin" />
            <text
              x={s.x}
              y={s.y + 5}
              textAnchor="middle"
              className="p-pin-text"
            >
              A
            </text>
            <circle cx={f.x} cy={f.y} r="20" className="p-pin" />
            <text
              x={f.x}
              y={f.y + 5}
              textAnchor="middle"
              className="p-pin-text"
            >
              B
            </text>
          </g>
        </Plan>
        <p className="wf-small mt-3">
          From A (Quarry Road) to B (Lantern Row) at 3 PM. The highlighted walk
          is drawn in full; the other is dotted.
        </p>
      </div>

      <div className="lg:col-span-5">
        <div
          className="wf-seg"
          role="group"
          aria-label="Which walk to highlight"
        >
          <button
            type="button"
            aria-pressed={show === "quick"}
            onClick={() => setShow("quick")}
          >
            Quickest
          </button>
          <button
            type="button"
            aria-pressed={show === "shade"}
            onClick={() => setShow("shade")}
          >
            More shade
          </button>
        </div>

        <div className="mt-8">
          <label
            htmlFor="wf-alpha"
            className="flex items-baseline justify-between gap-4 text-[16px] font-semibold"
          >
            Sun aversion
            <span className="wf-num wf-serif text-[32px] leading-none">
              {alpha}
            </span>
          </label>
          <input
            id="wf-alpha"
            type="range"
            className="wf-range"
            min={1}
            max={6}
            step={1}
            value={alpha}
            aria-valuetext={`${alpha}: one metre of sun costs as much as ${alpha} metre${alpha > 1 ? "s" : ""} of shade`}
            onChange={(e) => {
              setAlpha(Number(e.target.value));
              setShow("shade");
            }}
          />
          <p className="wf-small" aria-live="polite">
            {alpha === 1
              ? "At 1, sun and shade cost the same, so the shade route is simply the quickest route."
              : `At ${alpha}, a metre in the sun counts as ${alpha} metres in shade. The route leaves the avenue for tree-lined Bluff Walk and Cedar Lane.`}
          </p>
        </div>

        <div className="wf-slip mt-8">
          <div className="grid grid-cols-2 gap-6">
            <RouteCard
              title="Quickest"
              r={base.quick}
              active={show === "quick"}
              drawKey={activeKey}
              color="var(--wf-brick)"
            />
            <RouteCard
              title="More shade"
              r={shade}
              active={show === "shade"}
              drawKey={activeKey}
              color="var(--wf-shade)"
              note={
                same
                  ? "Same as quickest"
                  : `${Math.round(sunCut * 100)}% less sun`
              }
            />
          </div>
          <p className="-mx-7 mt-6 bg-(--wf-ink) px-7 py-3 text-[16px] font-semibold text-(--wf-paper)">
            {same
              ? "Raise sun aversion to trade a few minutes for shade."
              : `${Math.round(sunCut * 100)}% less sun for ${Math.round(extra * 100)}% more walking.`}
          </p>
        </div>
      </div>
    </div>
  );
}

const pct = (r: Route) => `${Math.round((r.shadeLen / r.len) * 100)}%`;
const fmtMin = (r: Route) => `${Math.round(minutes(r.len))} minutes`;

function RouteCard({
  title,
  r,
  active,
  note,
  drawKey,
  color,
}: {
  title: string;
  r: Route;
  active: boolean;
  note?: string;
  drawKey: string;
  color: string;
}) {
  const fl = feelsLike(HOUR);
  const share = r.shadeLen / r.len;
  const feels = Math.round(share * fl.shade + (1 - share) * fl.sun);
  return (
    <div>
      <h3
        className={`text-[18px] font-semibold ${active ? "" : "text-(--wf-ink-soft)"}`}
      >
        {title}
        {active && <span className="sr-only"> (highlighted)</span>}
      </h3>
      {/* Fills in step with the line on the plan, in the line's colour. */}
      <span
        key={active ? drawKey : "idle"}
        className="wf-duel-rule"
        data-on={active ? "" : undefined}
        style={{ "--c": color } as React.CSSProperties}
        aria-hidden="true"
      />
      <p className="wf-num wf-serif mt-1 text-[44px] leading-none">
        {Math.round(minutes(r.len))}
        <span className="text-[20px]"> min</span>
      </p>
      <dl className="wf-num mt-3">
        <Row k="Distance" v={`${(r.len / 1000).toFixed(2)} km`} />
        <Row k="In shade" v={pct(r)} />
        <Row k="In sun" v={`${Math.round(minutes(r.sunLen))} min`} />
        <Row k="Feels like" v={`~${feels} °F`} />
      </dl>
      {note && (
        <p className="mt-2 text-[15px] font-semibold text-(--wf-shade)">
          {note}
        </p>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="wf-leader wf-leader-stack text-[15px]!">
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
