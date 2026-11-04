import { DEMO } from "@/app/projects/runway/data";
import { monthLabel } from "./math";
import { s } from "./cls";

/**
 * The cash forecast drawn as an approach: the P10–P90 band is the glide
 * slope, the x-axis is the runway, touchdown is zero cash. Server-rendered
 * SVG built from the demo's published figures (an illustration of the
 * 1,000-path Monte Carlo, not a rerun of it). Lines draw in left to right.
 */

const MAX_M = 14;
const MAX_CASH = 1_000_000;

type Geo = { W: number; H: number; L: number; R: number; T: number; B: number };
const WIDE: Geo = { W: 960, H: 470, L: 72, R: 900, T: 24, B: 400 };
const NARROW: Geo = { W: 400, H: 430, L: 54, R: 386, T: 16, B: 360 };

function scales(g: Geo) {
  const x = (m: number) => g.L + (m / MAX_M) * (g.R - g.L);
  const y = (c: number) => g.B - (Math.max(0, c) / MAX_CASH) * (g.B - g.T);
  const pt = (m: number, c: number) => `${x(m).toFixed(1)},${y(c).toFixed(1)}`;
  const straight = (cash: number, zeroAt: number) =>
    `M${pt(0, cash)} L${pt(zeroAt, 0)}`;
  return { x, y, pt, straight };
}

// Deterministic PRNG so the server and every visit draw the same paths.
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function samplePaths(n: number, pt: (m: number, c: number) => string) {
  const rand = rng(1000);
  const out: string[] = [];
  const mid = DEMO.cash / DEMO.netBurn;
  for (let p = 0; p < n; p++) {
    // Spread end points across roughly the P10–P90 range and a little past it.
    const u = (rand() + rand() + rand()) / 3 - 0.5;
    const zeroAt = mid + u * 3.2;
    const burn = DEMO.cash / zeroAt;
    let cash = DEMO.cash;
    let d = `M${pt(0, cash)}`;
    for (let m = 0.5; m <= MAX_M; m += 0.5) {
      cash -= burn * 0.5 * (1 + (rand() - 0.5) * 0.5);
      d += ` L${pt(m, cash)}`;
      if (cash <= 0) break;
    }
    out.push(d);
  }
  return out;
}

const MID = DEMO.cash / DEMO.netBurn;

/** Side view of a small jet, nose at +x, centred on its wheels (0,0). */
const PLANE =
  "M-22,-6 L-17,-6 L-11,-1.5 L6,-1.5 Q15,-1.5 18,1.2 Q15,3.6 6,3.6 L-15,3.6 Z M-4,-1.5 L-11,-9 L-7,-9 L3,-1.5 Z M-6,3.6 L-12,10 L-8,10 L1,3.6 Z";

function slopeDeg(g: Geo, x: (m: number) => number, y: (c: number) => number) {
  const dx = x(MID) - x(0);
  const dy = g.B - y(DEMO.cash);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}
const ACT = (DEMO.cash + 119.99) / (DEMO.netBurn - 2570);

function Chart({ g, id, wide }: { g: Geo; id: string; wide: boolean }) {
  const { x, y, pt, straight } = scales(g);
  const paths = samplePaths(36, pt);
  const band = `M${pt(0, DEMO.cash)} L${pt(DEMO.rangeHigh, 0)} L${pt(DEMO.rangeLow, 0)} Z`;
  return (
    <svg
      viewBox={`0 0 ${g.W} ${g.H}`}
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
      className={`${s.glideSvg} ${wide ? s.glideWide : s.glideNarrow}`}
    >
      <title id={`${id}-title`}>
        Cash forecast for the demo company, drawn as a glide slope
      </title>
      <desc id={`${id}-desc`}>
        Cash starts at $952,350 and falls to zero. At today&apos;s burn it
        touches down at 12.2 months, November 3, 2027. The P10 to P90 band
        touches down between 11.6 and 13.0 months. If every fix is made it lands
        at 12.7 months. If revenue falls 30% it lands at 11.0 months.
      </desc>

      {/* runway: the x-axis, with the touchdown zone between P10 and P90 */}
      <rect
        x={g.L}
        y={g.B}
        width={g.R - g.L}
        height={22}
        className={s.gsTarmac}
      />
      <rect
        x={x(DEMO.rangeLow)}
        y={g.B}
        width={x(DEMO.rangeHigh) - x(DEMO.rangeLow)}
        height={22}
        className={s.gsZone}
      />
      {Array.from({ length: Math.floor((g.R - g.L) / 38) }, (_, i) => (
        <rect
          key={i}
          x={g.L + 8 + i * 38}
          y={g.B + 9.5}
          width={20}
          height={3}
          className={s.gsDash}
        />
      ))}

      <g className={s.gsBand}>
        <path d={band} className={s.gsBandFill} />
      </g>

      <g className={s.gsDraw}>
        {paths.map((d, i) => (
          <path key={i} d={d} className={s.gsPath} />
        ))}
        <path d={straight(DEMO.cash, DEMO.revenueDrop)} className={s.gsAmber} />
        <path d={straight(DEMO.cash, MID)} className={s.gsMid} />
        <path d={straight(DEMO.cash + 119.99, ACT)} className={s.gsAct} />
      </g>

      {/* touchdown: a ring that ripples once the aircraft lands */}
      <circle cx={x(MID)} cy={g.B} r={7} className={s.gsRing} />
      <circle cx={x(MID)} cy={g.B} r={6} className={s.gsTouch} />

      {/* the aircraft flies today's burn line from now to zero cash */}
      <g
        className={s.gsPlane}
        style={
          {
            "--x0": `${x(0)}px`,
            "--y0": `${y(DEMO.cash)}px`,
            "--x1": `${x(MID)}px`,
            "--y1": `${g.B}px`,
          } as React.CSSProperties
        }
      >
        <g
          className={s.gsPlanePitch}
          style={
            {
              "--pitch": `${slopeDeg(g, x, y).toFixed(1)}deg`,
            } as React.CSSProperties
          }
        >
          <path d={PLANE} className={s.gsPlaneBody} />
        </g>
      </g>

      {wide && (
        <g className={s.gsLabels}>
          <text
            x={x(3.6)}
            y={y(DEMO.cash * (1 - 3.6 / DEMO.revenueDrop)) + 110}
          >
            <tspan className={s.gsAmberText}>Revenue −30%</tspan>
            <tspan x={x(3.6)} dy={24}>
              11.0 mo
            </tspan>
          </text>
          <text x={x(MID) + 24} y={g.B - 100}>
            <tspan className={s.gsStrong}>Today&apos;s burn</tspan>
            <tspan x={x(MID) + 24} dy={24}>
              12.2 mo · Nov 3, 2027
            </tspan>
          </text>
          <text x={x(ACT) + 24} y={g.B - 44}>
            <tspan className={s.gsCleared}>If you act</tspan>
            <tspan x={x(ACT) + 24} dy={24}>
              12.7 mo
            </tspan>
          </text>
          <text x={x(4.2)} y={y(DEMO.cash * 0.84)}>
            <tspan className={s.gsStrong}>P10–P90</tspan>
            <tspan x={x(4.2)} dy={24}>
              11.6 to 13.0 mo
            </tspan>
          </text>
        </g>
      )}

      <g className={s.gsAxis}>
        {(wide ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 4, 8, 12]).map((m) => (
          <text key={m} x={x(m)} y={g.B + 46} textAnchor="middle">
            {monthLabel(m)}
          </text>
        ))}
        {[0, 500_000, 1_000_000].map((c) => (
          <text key={c} x={g.L - 10} y={y(c) + 5} textAnchor="end">
            {c === 0 ? "$0" : c === 500_000 ? "$500k" : "$1M"}
          </text>
        ))}
      </g>
    </svg>
  );
}

export function GlideSlope() {
  return (
    <figure className={s.glide}>
      <Chart g={WIDE} id="glide-wide" wide />
      <Chart g={NARROW} id="glide-narrow" wide={false} />
      <ul className={s.glideKey} aria-hidden="true">
        <li>
          <span className={s.keyMid} /> Today&apos;s burn: 12.2 mo, Nov 3, 2027
        </li>
        <li>
          <span className={s.keyBand} /> P10–P90: 11.6 to 13.0 mo
        </li>
        <li>
          <span className={s.keyAct} /> If you act: 12.7 mo
        </li>
        <li>
          <span className={s.keyAmber} /> Revenue −30%: 11.0 mo
        </li>
      </ul>
      <figcaption className={s.glideCap}>
        Drawn from the demo&apos;s published range: 1,000 simulated paths of the
        last six months&apos; burn trend plus noise, summarised as P10 to P90.
        The thin lines are 36 illustrative paths, not the model&apos;s output.
      </figcaption>
    </figure>
  );
}
