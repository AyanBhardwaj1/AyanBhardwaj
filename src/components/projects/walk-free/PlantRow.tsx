"use client";

import { useMemo, useState } from "react";
import { Plan } from "./Plan";
import {
  allExposure,
  areaShare,
  EDGES,
  feelsLike,
  HOT_STREETS,
  plantRow,
  ptsToD,
  shadowsAt,
  streetShare,
  sunStroke,
} from "./world";

const HOUR = 15;
const COUNT = 24;

type Key = (typeof HOT_STREETS)[number]["key"];

/** Line a hot street with 24 trees and read shade and feels-like before and after, at 3 PM. */
export function PlantRow() {
  const [key, setKey] = useState<Key>("long");
  const [planted, setPlanted] = useState(false);
  const street = HOT_STREETS.find((s) => s.key === key)!;
  const ids = street.ids as readonly string[];

  const before = useMemo(() => {
    const shadows = shadowsAt(HOUR);
    return { shadows, exposure: allExposure(shadows) };
  }, []);
  const trees = useMemo(() => plantRow([...ids], COUNT), [ids]);
  const after = useMemo(() => {
    const shadows = shadowsAt(HOUR, trees);
    return { shadows, exposure: allExposure(shadows) };
  }, [trees]);

  const fl = feelsLike(HOUR);
  const sb = streetShare([...ids], before.exposure);
  const sa = streetShare([...ids], after.exposure);
  const ab = areaShare(before.exposure);
  const aa = areaShare(after.exposure);
  const feels = (s: number) => Math.round(s * fl.shade + (1 - s) * fl.sun);
  const view = planted ? after : before;

  const pick = (k: Key) => {
    setKey(k);
    setPlanted(false);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:order-2 lg:col-span-7">
        <Plan
          id="wf-plant-plan"
          shadows={view.shadows}
          exposure={view.exposure}
          newTrees={planted ? trees : []}
          sunColor={sunStroke(fl.sunlight)}
          title={`${street.name} at 3 PM ${planted ? `with ${COUNT} new trees` : "as it is"}`}
          desc={`${street.name} is ${Math.round((planted ? sa : sb) * 100)} percent shaded and feels like about ${feels(planted ? sa : sb)} degrees Fahrenheit on average.`}
        >
          <g aria-hidden="true">
            {EDGES.filter((e) => ids.includes(e.id)).map((e) => (
              <path
                key={e.id}
                d={ptsToD(e.pts)}
                fill="none"
                stroke="var(--wf-gold)"
                strokeOpacity="0.45"
                strokeWidth="30"
                strokeLinecap="round"
              />
            ))}
          </g>
        </Plan>
      </div>
      <div className="lg:order-1 lg:col-span-5">
        <fieldset>
          <legend className="text-[16px] font-semibold">
            Pick a hot street
          </legend>
          <div className="wf-seg mt-3 flex! flex-wrap">
            {HOT_STREETS.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={s.key === key}
                onClick={() => pick(s.key)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="wf-btn"
            onClick={() => setPlanted(true)}
            disabled={planted}
            aria-disabled={planted}
          >
            Plant {COUNT} shade trees on {street.name}
          </button>
          {planted && (
            <button
              type="button"
              className="wf-btn wf-btn-ghost"
              onClick={() => setPlanted(false)}
            >
              Undo
            </button>
          )}
        </div>

        <dl className="mt-10 grid gap-7" aria-live="polite">
          <Compare
            label={`Shade on ${street.name}`}
            a={sb}
            b={sa}
            on={planted}
            fmt={(v) => `${Math.round(v * 100)}%`}
          />
          <div>
            <dt className="text-[16px] font-semibold">
              Feels like on {street.name}
            </dt>
            <dd className="wf-num wf-serif mt-1 flex items-baseline gap-4 text-[56px] leading-none">
              <span>{feels(planted ? sa : sb)}°F</span>
              {planted && (
                <span className="text-[22px] text-(--wf-shade)">
                  {feels(sb) - feels(sa)} °F cooler
                </span>
              )}
            </dd>
          </div>
          <Compare
            label="Shade across the district"
            a={ab}
            b={aa}
            on={planted}
            fmt={(v) => `${(v * 100).toFixed(1)}%`}
          />
        </dl>
      </div>
    </div>
  );
}

function Compare({
  label,
  a,
  b,
  on,
  fmt,
}: {
  label: string;
  a: number;
  b: number;
  on: boolean;
  fmt: (v: number) => string;
}) {
  const v = on ? b : a;
  return (
    <div>
      <dt className="flex justify-between text-[16px] font-semibold">
        <span>{label}</span>
        <span className="wf-num">
          {on ? (
            <>
              {fmt(a)} → {fmt(b)}
            </>
          ) : (
            fmt(a)
          )}
        </span>
      </dt>
      <dd className="wf-bar mt-2">
        <i style={{ transform: `scaleX(${v})` }} />
      </dd>
    </div>
  );
}
