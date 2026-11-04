/**
 * Seven invented cities, printed as postcards: flat banded skies, a skyline
 * silhouette drawn from a seed, and each city's weather layer as a small CSS
 * loop (rain, glare, speed streaks, aurora, neon, heat haze, falling leaves).
 * Server component; the loops stop under prefers-reduced-motion.
 */

type City = {
  name: string;
  line: string;
  weather: string;
  sky: string[];
  ground: string;
  ink: string;
  strip: [string, string];
  style: "dense" | "tall" | "low" | "spire" | "mid" | "dune" | "canopy";
  windows?: string;
  fx: React.ReactNode;
  stat?: string;
};

const CITIES: City[] = [
  {
    name: "Noir Harbor",
    line: "Black towers, gold windows and rain that never lets up.",
    weather: "Rain, 9 PM",
    sky: ["#1b1d22", "#23262c", "#2c2f35"],
    ground: "#101114",
    ink: "#f4f1e6",
    strip: ["#1b1d22", "#f4f1e6"],
    style: "dense",
    windows: "#f1d27a",
    fx: <div className="wx wx-rain" />,
  },
  {
    name: "Skyline Prime",
    line: "Chrome towers and wide boulevards in hard noon light.",
    weather: "Clear, glare",
    sky: ["#7fb3d9", "#a9cbe3", "#d5e4ec"],
    ground: "#2a4058",
    ink: "#17241b",
    strip: ["#2a4058", "#f4f1e6"],
    style: "tall",
    fx: (
      <svg className="wx wx-glint" viewBox="0 0 100 125" aria-hidden="true">
        <circle cx="78" cy="22" r="7" fill="#fffdf6" />
      </svg>
    ),
  },
  {
    name: "Velocity Bay",
    line: "Long straight avenues off the bay, where the wind leaves streaks.",
    weather: "Bay breeze",
    sky: ["#5fb4e6", "#93cdee", "#cfe8f4"],
    ground: "#21465e",
    ink: "#17241b",
    strip: ["#cfe8f4", "#17241b"],
    style: "low",
    fx: (
      <>
        <div className="wx wx-streak" />
        <div className="wx wx-streak b" />
      </>
    ),
  },
  {
    name: "Aurora Realm",
    line: "A golden citadel at the edge of the northern sky.",
    weather: "Aurora",
    sky: ["#1f2547", "#4b4a6b", "#b98f5b", "#efc670"],
    ground: "#161a33",
    ink: "#f4f1e6",
    strip: ["#efc670", "#17241b"],
    style: "spire",
    fx: <div className="wx wx-aurora" />,
  },
  {
    name: "Neon District",
    line: "The night never ends under a thousand signs.",
    weather: "Night, neon",
    sky: ["#1a0f26", "#2a1440", "#3a1a55"],
    ground: "#0f0818",
    ink: "#f4f1e6",
    strip: ["#2a1440", "#f4f1e6"],
    style: "mid",
    windows: "#ff6ad5",
    fx: null,
  },
  {
    name: "Dune Reach",
    line: "The open boulevards bake; the old quarter's lanes keep the shade.",
    weather: "Desert, 3 PM",
    sky: ["#e9a35f", "#f0bb7c", "#f6d6a4"],
    ground: "#7a4a22",
    ink: "#17241b",
    strip: ["#7a4a22", "#f4f1e6"],
    style: "dune",
    fx: null,
    stat: "Quickest route 0% shade. Shade route 68%.",
  },
  {
    name: "Verdant Canopy",
    line: "A city that grew a forest over every street.",
    weather: "Under canopy",
    sky: ["#9fd39a", "#bfe0b3", "#dcefd3"],
    ground: "#2f5a33",
    ink: "#17241b",
    strip: ["#2f5a33", "#f4f1e6"],
    style: "canopy",
    fx: (
      <svg className="wx" viewBox="0 0 100 125" aria-hidden="true">
        {[14, 38, 62, 84].map((x, i) => (
          <ellipse
            key={x}
            className="wx-leaf"
            cx={x}
            cy="6"
            rx="2.4"
            ry="1.3"
            fill="#3f7a3f"
            style={{ animationDelay: `${i * -1.7}s` }}
          />
        ))}
      </svg>
    ),
    stat: "87% of walking in shade.",
  },
];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Skyline({ c, seed }: { c: City; seed: number }) {
  const r = rng(seed);
  const W = 320;
  const H = 260;
  const bars: { x: number; w: number; h: number; dome?: boolean }[] = [];
  let x = 0;
  while (x < W) {
    const w =
      c.style === "low"
        ? 12 + r() * 14
        : c.style === "dense"
          ? 14 + r() * 18
          : 20 + r() * 26;
    let h: number;
    switch (c.style) {
      case "dense":
        h = 90 + r() * 150;
        break;
      case "tall":
        h = 80 + r() * 170;
        break;
      case "low":
        h = 30 + r() * 80;
        break;
      case "spire":
        h = 30 + r() * 45;
        break;
      case "mid":
        h = 60 + r() * 110;
        break;
      case "dune":
        h = 22 + r() * 40;
        break;
      default:
        h = 26 + r() * 50;
    }
    bars.push({ x, w, h, dome: c.style === "dune" && r() > 0.6 });
    x += w + (c.style === "low" ? 3 : 2);
  }
  const wins: { x: number; y: number }[] = [];
  if (c.windows)
    for (const b of bars)
      for (let wy = H - b.h + 10; wy < H - 8; wy += 14)
        for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 7)
          if (r() > 0.72) wins.push({ x: wx, y: wy });
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
    >
      {c.style === "dune" && (
        <rect x="0" y={H - 70} width={W} height="70" fill="#c78a4c" />
      )}
      {c.style === "spire" && (
        <rect
          x={W / 2 - 9}
          y={H - 236}
          width="18"
          height="236"
          fill={c.ground}
        />
      )}
      {c.style === "spire" && (
        <rect x={W / 2 - 1} y={H - 256} width="2" height="22" fill={c.ground} />
      )}
      <g fill={c.ground} className={c.style === "dune" ? "wx-haze" : undefined}>
        {bars.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={H - b.h} width={b.w} height={b.h} />
            {b.dome && <circle cx={b.x + b.w / 2} cy={H - b.h} r={b.w / 2.4} />}
          </g>
        ))}
      </g>
      {c.style === "canopy" && (
        <g fill="#3d7a42">
          {Array.from({ length: 16 }, (_, i) => (
            <circle
              key={i}
              cx={i * 21 + 6}
              cy={H - 40 - (i % 3) * 14}
              r={18 + (i % 4) * 4}
            />
          ))}
        </g>
      )}
      {wins.length > 0 && (
        <g
          fill={c.windows}
          className={c.style === "mid" ? "wx-neon" : undefined}
        >
          {wins.map((w, i) => (
            <rect key={i} x={w.x} y={w.y} width="3" height="4" />
          ))}
        </g>
      )}
    </svg>
  );
}

export function Postcards() {
  return (
    <ul className="wf-cards" aria-label="Seven fictional cities">
      {CITIES.map((c, i) => (
        <li key={c.name} className="wf-card">
          <div className="wf-card-sky" style={{ background: c.sky[0] }}>
            {c.sky.slice(1).map((col, k) => (
              <div
                key={col}
                className="absolute inset-x-0 bottom-0"
                style={{
                  background: col,
                  top: `${((k + 1) / c.sky.length) * 62}%`,
                }}
              />
            ))}
            {c.fx}
            <Skyline c={c} seed={i * 97 + 13} />
            <h3 className="wf-card-title" style={{ color: c.ink }}>
              {c.name}
            </h3>
          </div>
          <div
            className="wf-card-strip"
            style={{ background: c.strip[0], color: c.strip[1] }}
          >
            <p className="flex justify-between gap-3 font-semibold">
              <span>Fictional city</span>
              <span>{c.weather}</span>
            </p>
            <p>{c.line}</p>
            {c.stat && <p className="wf-card-stat font-semibold">{c.stat}</p>}
          </div>
        </li>
      ))}
      <li className="wf-card">
        <div className="wf-card-sky flex flex-col justify-end gap-4 bg-(--wf-ink) p-5 text-(--wf-paper)">
          <p className="wf-serif text-[30px] leading-[1.05]">
            Or describe your own.
          </p>
          <p className="wf-coord text-(--wf-paper)! opacity-90">
            “a rain-soaked noir city from a 90s cartoon”
          </p>
          <p className="text-[15px] leading-snug">
            The assistant plans districts, landmarks, street names, climate and
            sky; a deterministic builder turns that plan into a walkable city.
          </p>
        </div>
        <div className="wf-card-strip bg-(--wf-gold) text-(--wf-on-gold)">
          <p className="flex justify-between gap-3 font-semibold">
            <span>Generated</span>
            <span>Ravenmoor</span>
          </p>
          <p className="wf-num">930 buildings, built in 0.2 s</p>
        </div>
      </li>
    </ul>
  );
}
