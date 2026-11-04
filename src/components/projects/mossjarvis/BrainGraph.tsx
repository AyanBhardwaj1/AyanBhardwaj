"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cosine, localEmbedding } from "./embed";
import "./jarvis.css";

type Source = { id: string; kind: string; chunks: string[] };

/** Demo sources, the kinds the Ingest tab accepts. */
const SOURCES: Source[] = [
  {
    id: "launch-notes.md",
    kind: "Markdown",
    chunks: [
      "Launch plan: one post on Thursday, one demo video, lead with offline recall.",
      "Checklist: record demo, write post, update README screenshots.",
    ],
  },
  {
    id: "claude-export.json",
    kind: "Claude export",
    chunks: [
      "Conversation about the launch post structure and the demo video script.",
      "Discussed memory recall and why local first matters for the launch.",
    ],
  },
  {
    id: "chatgpt-export.json",
    kind: "ChatGPT export",
    chunks: [
      "Brainstormed names for the assistant and the HUD reactor states.",
      "Compared vector search options and cosine similarity scoring.",
    ],
  },
  {
    id: "vector-search-talk",
    kind: "YouTube transcript",
    chunks: [
      "Talk transcript on vector search, embeddings, cosine similarity and top k recall.",
      "Hybrid ranking mixes lexical scores with vector similarity.",
    ],
  },
  {
    id: "moss-docs.html",
    kind: "HTML",
    chunks: [
      "Moss SessionIndex runs local queries; loadIndex hydrates a cloud snapshot.",
      "Custom embeddings can be passed to Moss with each document.",
    ],
  },
  {
    id: "tauri-guide.pdf",
    kind: "PDF",
    chunks: [
      "Tauri windows can be frameless, transparent and always on top.",
      "Bundling a sidecar Node server inside the macOS app.",
    ],
  },
  {
    id: "weekly-update.docx",
    kind: "Word",
    chunks: [
      "Weekly update draft: launch status, demo video, next tasks.",
      "Tasks: send the update Friday, review the briefing prompt.",
    ],
  },
  {
    id: "briefing-prompt.txt",
    kind: "Text",
    chunks: [
      "Morning briefing prompt: overdue tasks first, then due today, then high priority.",
      "Keep the briefing short, under six lines.",
    ],
  },
  {
    id: "memory-paper",
    kind: "Article",
    chunks: [
      "Article on long term memory for assistants: working memory versus durable recall.",
      "Recency decay with a half life keeps fresh memories ranked higher.",
    ],
  },
  {
    id: "voice-notes.md",
    kind: "Markdown",
    chunks: [
      "Wake word Jarvis on device with Porcupine, speech to text with Cheetah.",
      "ElevenLabs voice for responses, fallback to system speech.",
    ],
  },
  {
    id: "reading-log.csv",
    kind: "CSV",
    chunks: [
      "Reading log of articles on embeddings, memory and agents.",
      "Rows: title, source, date read, rating.",
    ],
  },
  {
    id: "openrouter-models",
    kind: "Article",
    chunks: [
      "OpenRouter model list: pick any chat model slug for generation.",
      "Strict JSON output with response, facts and tasks fields.",
    ],
  },
  {
    id: "design-notes.org",
    kind: "Org",
    chunks: [
      "HUD design notes: arc reactor rings, scanlines, clipped panels, cyan on ink.",
      "Offline state re tints the HUD red.",
    ],
  },
  {
    id: "server.log",
    kind: "Log",
    chunks: [
      "Moss cloud quota exceeded, falling back to local index, turn saved to disk.",
      "Retry cloud sync on next init.",
    ],
  },
];

type Node = Source & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  deg: number;
};
type Edge = { a: number; b: number; w: number };

function build() {
  const vecs = SOURCES.map((src) =>
    localEmbedding(`${src.id.replace(/[.-]/g, " ")} ${src.chunks.join(" ")}`),
  );
  const keep = new Map<string, Edge>();
  vecs.forEach((v, i) => {
    vecs
      .map((u, j) => ({ j, w: i === j ? -1 : cosine(v, u) }))
      .filter((e) => e.w >= 0.08)
      .sort((x, y) => y.w - x.w)
      .slice(0, 6)
      .forEach(({ j, w }) => {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        keep.set(k, { a: Math.min(i, j), b: Math.max(i, j), w });
      });
  });
  const edges = [...keep.values()];
  const nodes: Node[] = SOURCES.map((src, i) => {
    const t = (i / SOURCES.length) * Math.PI * 2;
    return {
      ...src,
      x: Math.cos(t) * 160,
      y: Math.sin(t) * 160,
      vx: 0,
      vy: 0,
      deg: 0,
    };
  });
  edges.forEach((e) => {
    nodes[e.a].deg++;
    nodes[e.b].deg++;
  });
  // Pre-settle a small force layout (no animation needed).
  for (let it = 0; it < 400; it++) {
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const A = nodes[i];
        const B = nodes[j];
        const dx = A.x - B.x;
        const dy = A.y - B.y;
        const d2 = dx * dx + dy * dy + 0.01;
        const f = 6000 / d2;
        const d = Math.sqrt(d2);
        A.vx += (dx / d) * f;
        A.vy += (dy / d) * f;
        B.vx -= (dx / d) * f;
        B.vy -= (dy / d) * f;
      }
    for (const e of edges) {
      const A = nodes[e.a];
      const B = nodes[e.b];
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - (150 - e.w * 120)) * 0.01;
      A.vx += (dx / d) * f;
      A.vy += (dy / d) * f;
      B.vx -= (dx / d) * f;
      B.vy -= (dy / d) * f;
    }
    for (const n of nodes) {
      n.vx -= n.x * 0.004;
      n.vy -= n.y * 0.004;
      n.x += n.vx *= 0.6;
      n.y += n.vy *= 0.6;
    }
  }
  // Centre on the bounding box and normalise to [-1, 1] on both axes; the
  // draw pass scales that to whatever frame the canvas has.
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const [x0, x1, y0, y1] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  for (const n of nodes) {
    n.x = ((n.x - x0) / (x1 - x0 || 1)) * 2 - 1;
    n.y = ((n.y - y0) / (y1 - y0 || 1)) * 2 - 1;
  }
  return { nodes, edges };
}

type View = { x: number; y: number; k: number };
type Box = { x0: number; y0: number; x1: number; y1: number };

/** Screen-space projection for a w×h canvas: fill the frame, centred. */
function projector(w: number, h: number, view: View) {
  const padX = w < 520 ? 34 : 70;
  const padY = w < 520 ? 30 : 44;
  const hx = Math.max(40, w / 2 - padX);
  const hy = Math.max(40, h / 2 - padY);
  // Allow some stretch towards the frame's aspect, not a full squash.
  const base = Math.min(hx, hy);
  const sx = Math.min(hx, base * 1.6) * view.k;
  const sy = Math.min(hy, base * 1.6) * view.k;
  const scale = Math.min(1.25, Math.max(0.7, base / 190)) * Math.sqrt(view.k);
  return {
    x: (n: Node) => w / 2 + view.x + n.x * sx,
    y: (n: Node) => h / 2 + view.y + n.y * sy,
    r: (n: Node) => (4 + n.deg * 0.75) * scale,
  };
}

const hit = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

export function BrainGraph() {
  const { nodes, edges } = useMemo(() => build(), []);
  const [sel, setSel] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const neighbours = useMemo(
    () =>
      edges
        .filter((e) => e.a === sel || e.b === sel)
        .map((e) => ({ n: nodes[e.a === sel ? e.b : e.a], w: e.w }))
        .sort((x, y) => y.w - x.w),
    [edges, nodes, sel],
  );

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth;
      const h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const P = projector(w, h, view);
      const linked = new Set(neighbours.map((x) => x.n.id));
      for (const e of edges) {
        const on = e.a === sel || e.b === sel;
        ctx.strokeStyle = on
          ? `rgba(154,245,255,${0.35 + e.w})`
          : `rgba(45,223,255,${0.04 + e.w * 0.18})`;
        ctx.lineWidth = on ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(P.x(nodes[e.a]), P.y(nodes[e.a]));
        ctx.lineTo(P.x(nodes[e.b]), P.y(nodes[e.b]));
        ctx.stroke();
      }
      // Nodes are obstacles for labels, as are the zoom buttons.
      const taken: Box[] = [{ x0: w - 60, y0: 0, x1: w, y1: 150 }];
      nodes.forEach((n, i) => {
        const r = P.r(n);
        const x = P.x(n);
        const y = P.y(n);
        const isSel = i === sel;
        const near = linked.has(n.id);
        ctx.shadowColor = "#2ddfff";
        ctx.shadowBlur = isSel ? 18 : near || i === hover ? 8 : 0;
        ctx.fillStyle = isSel ? "#9af5ff" : near ? "#2ddfff" : "#0b4c63";
        ctx.strokeStyle = "#2ddfff";
        ctx.lineWidth = i === hover && !isSel ? 2 : 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        taken.push({ x0: x - r, y0: y - r, x1: x + r, y1: y + r });
      });
      // Labels, greedily: selected and hovered first, then the selected
      // node's neighbours by weight, then the best-connected rest. A label
      // that cannot find a free slot is left out (its node still shows).
      const neighbourRank = new Map(neighbours.map((x, i) => [x.n.id, i]));
      const order = nodes
        .map((n, i) => ({
          i,
          rank:
            i === sel
              ? -2
              : i === hover
                ? -1
                : neighbourRank.has(n.id)
                  ? neighbourRank.get(n.id)!
                  : 100 - n.deg,
        }))
        .sort((a, b) => a.rank - b.rank);
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "alphabetic";
      for (const { i, rank } of order) {
        const n = nodes[i];
        const r = P.r(n);
        const x = P.x(n);
        const y = P.y(n);
        const tw = ctx.measureText(n.id).width;
        const slots: { tx: number; ty: number; box: Box }[] = [
          [x - tw / 2, y + r + 4],
          [x - tw / 2, y - r - 17],
          [x + r + 6, y - 7],
          [x - r - 6 - tw, y - 7],
        ].map(([bx, by]) => ({
          tx: bx,
          ty: by + 10,
          box: { x0: bx - 2, y0: by, x1: bx + tw + 2, y1: by + 13 },
        }));
        const inFrame = (b: Box) =>
          b.x0 >= 2 && b.x1 <= w - 2 && b.y0 >= 2 && b.y1 <= h - 2;
        let slot = slots.find(
          (s) => inFrame(s.box) && !taken.some((t) => hit(s.box, t)),
        );
        if (!slot && rank < 0)
          slot = slots.find((s) => inFrame(s.box)) ?? slots[0];
        if (!slot) continue;
        taken.push(slot.box);
        const isSel = i === sel;
        ctx.fillStyle =
          isSel || i === hover
            ? "#e6fdff"
            : linked.has(n.id)
              ? "#c9faff"
              : "#62cadd";
        ctx.textAlign = "left";
        ctx.fillText(n.id, slot.tx, slot.ty);
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [nodes, edges, sel, hover, view, neighbours]);

  /** Nearest node under a canvas-relative point, or -1. */
  const pick = (px: number, py: number) => {
    const c = canvas.current!;
    const P = projector(c.clientWidth, c.clientHeight, view);
    let best = -1;
    let bd = Infinity;
    nodes.forEach((n, i) => {
      const d = Math.hypot(P.x(n) - px, P.y(n) - py);
      if (d < Math.max(P.r(n) + 6, 20) && d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };

  const zoom = (f: number) =>
    setView((v) => ({ ...v, k: Math.min(3, Math.max(0.5, v.k * f)) }));

  const current = nodes[sel];

  return (
    <div className="jv-brain">
      <div className="jv-brainCanvasWrap">
        <canvas
          ref={canvas}
          className="jv-brainCanvas"
          aria-hidden="true"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, moved: false };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) {
              if (e.pointerType !== "mouse") return;
              const r = e.currentTarget.getBoundingClientRect();
              const best = pick(e.clientX - r.left, e.clientY - r.top);
              setHover(best >= 0 ? best : null);
              e.currentTarget.style.cursor = best >= 0 ? "pointer" : "";
              return;
            }
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
            if (d.moved) {
              d.x = e.clientX;
              d.y = e.clientY;
              setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
            }
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            drag.current = null;
            if (d?.moved) return;
            const r = e.currentTarget.getBoundingClientRect();
            const best = pick(e.clientX - r.left, e.clientY - r.top);
            if (best >= 0) setSel(best);
          }}
          onPointerLeave={() => setHover(null)}
          onWheel={(e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            zoom(e.deltaY < 0 ? 1.1 : 0.9);
          }}
        />
        <div className="jv-zoomBtns">
          <button type="button" onClick={() => zoom(1.2)} aria-label="Zoom in">
            +
          </button>
          <button
            type="button"
            onClick={() => zoom(1 / 1.2)}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setView({ x: 0, y: 0, k: 1 })}
            aria-label="Reset view"
          >
            ⟲
          </button>
        </div>
      </div>

      <div className="jv-brainSide">
        <h3 className="jv-hashHead">
          SOURCES{" "}
          <small>
            {nodes.length} · {edges.length} links
          </small>
        </h3>
        <ul className="jv-sourceList">
          {nodes.map((n, i) => (
            <li key={n.id}>
              <button
                type="button"
                aria-pressed={i === sel}
                onClick={() => setSel(i)}
              >
                {n.id}
              </button>
            </li>
          ))}
        </ul>
        <section
          className="jv-inspector"
          aria-live="polite"
          aria-label="Selected source"
        >
          <p className="jv-inspKind">{current.kind.toUpperCase()}</p>
          <p className="jv-inspTitle">{current.id}</p>
          <ol>
            {current.chunks.map((c, i) => (
              <li key={c}>
                <small>
                  {current.id}#{i + 1}
                </small>
                {c}
              </li>
            ))}
          </ol>
          <p className="jv-inspKind">STRONGEST NEIGHBOURS</p>
          <ul className="jv-neigh">
            {neighbours.slice(0, 6).map(({ n, w }) => (
              <li key={n.id}>
                <span>{n.id}</span>
                <b>{w.toFixed(2)}</b>
              </li>
            ))}
            {!neighbours.length && <li>No edge above 0.08.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
