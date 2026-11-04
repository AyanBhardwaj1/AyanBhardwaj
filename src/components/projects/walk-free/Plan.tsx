import {
  BUILDINGS,
  EDGES,
  PLAN_H,
  PLAN_W,
  ptsToD,
  TREES,
  type EdgeExposure,
  type Shadows,
  type Tree,
} from "./world";

/**
 * The drawn district as SVG layers: blocks, lawn, street casings, shadows,
 * buildings, crowns, then every path split into shade runs (solid blue) and
 * sun runs (dashed heat colour). Presentational only; no hooks, so it renders
 * on the server for the no-JS state and inside client components.
 */
export function Plan({
  shadows,
  exposure,
  newTrees = [],
  sunColor,
  title,
  desc,
  labels = true,
  dim = false,
  children,
  className = "",
  id,
}: {
  id: string;
  shadows: Shadows;
  exposure: Map<string, EdgeExposure>;
  newTrees?: Tree[];
  sunColor: string;
  title: string;
  desc: string;
  labels?: boolean;
  dim?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${PLAN_W} ${PLAN_H}`}
      className={`wf-plan ${className}`}
      role="img"
      aria-labelledby={`${id}-t ${id}-d`}
      style={{ "--wf-sun": sunColor } as React.CSSProperties}
    >
      <title id={`${id}-t`}>{title}</title>
      <desc id={`${id}-d`}>{desc}</desc>
      <rect x="270" y="420" width="230" height="180" className="p-lawn" />
      <rect x="500" y="240" width="230" height="180" className="p-lawn" />
      <g className="p-street" strokeWidth="18">
        {EDGES.map((e) => (
          <path key={e.id} d={ptsToD(e.pts)} />
        ))}
      </g>
      <g className="p-shadow">
        {shadows.polys.map((p, i) => (
          <polygon
            key={i}
            points={p.pts
              .map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`)
              .join(" ")}
          />
        ))}
        {shadows.crowns.map((c, i) => (
          <circle key={i} cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r={c.r} />
        ))}
      </g>
      <g>
        {BUILDINGS.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            className="p-bldg"
          />
        ))}
      </g>
      <g>
        {TREES.map((t, i) => (
          <circle
            key={i}
            cx={t.x.toFixed(1)}
            cy={t.y.toFixed(1)}
            r={t.r * 0.8}
            className="p-tree"
          />
        ))}
        {newTrees.map((t, i) => (
          <circle
            key={`n${i}`}
            cx={t.x.toFixed(1)}
            cy={t.y.toFixed(1)}
            r={t.r * 0.8}
            className="p-tree-new"
            style={{ animationDelay: `${i * 45}ms` }}
          />
        ))}
      </g>
      <g opacity={dim ? 0.45 : 1}>
        {EDGES.map((e) => {
          const x = exposure.get(e.id);
          if (!x) return null;
          return x.runs.map((r, k) => (
            <path
              key={`${e.id}-${k}`}
              d={ptsToD(r.pts)}
              className={r.shade ? "p-shade" : "p-sun"}
              strokeWidth={r.shade ? 5 : 5.5}
            />
          ));
        })}
      </g>
      {children}
      {labels && (
        <g aria-hidden="true">
          <text x="300" y="232" className="p-label">
            Cedar Lane
          </text>
          <text x="560" y="412" className="p-label">
            Long Avenue
          </text>
          <text x="952" y="150" className="p-label" textAnchor="end">
            Mill Street
          </text>
          <text x="545" y="268" className="p-label">
            Pecan Walk
          </text>
          <text x="300" y="470" className="p-label">
            South Lawn
          </text>
        </g>
      )}
    </svg>
  );
}
