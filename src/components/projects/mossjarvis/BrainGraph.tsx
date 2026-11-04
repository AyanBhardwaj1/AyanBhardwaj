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
  // Centre and fit into a 360-unit box so labels stay inside the canvas.
  const cx = nodes.reduce((a, n) => a + n.x, 0) / nodes.length;
  const cy = nodes.reduce((a, n) => a + n.y, 0) / nodes.length;
  const ext =
    Math.max(...nodes.map((n) => Math.hypot(n.x - cx, n.y - cy))) || 1;
  for (const n of nodes) {
    n.x = ((n.x - cx) / ext) * 170;
    n.y = ((n.y - cy) / ext) * 150;
  }
  return { nodes, edges };
}

export function BrainGraph() {
  const { nodes, edges } = useMemo(() => build(), []);
  const [sel, setSel] = useState(0);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
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
      const fit = Math.min(w, h) / 420;
      ctx.translate(w / 2 + view.x, h / 2 + view.y);
      ctx.scale(fit * view.k, fit * view.k);
      const linked = new Set(neighbours.map((x) => x.n.id));
      for (const e of edges) {
        const on = e.a === sel || e.b === sel;
        ctx.strokeStyle = on
          ? `rgba(154,245,255,${0.35 + e.w})`
          : `rgba(45,223,255,${0.04 + e.w * 0.18})`;
        ctx.lineWidth = on ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(nodes[e.a].x, nodes[e.a].y);
        ctx.lineTo(nodes[e.b].x, nodes[e.b].y);
        ctx.stroke();
      }
      nodes.forEach((n, i) => {
        const r = 5 + n.deg * 0.9;
        const isSel = i === sel;
        const near = linked.has(n.id);
        ctx.shadowColor = "#2ddfff";
        ctx.shadowBlur = isSel ? 18 : near ? 8 : 0;
        ctx.fillStyle = isSel ? "#9af5ff" : near ? "#2ddfff" : "#0b4c63";
        ctx.strokeStyle = "#2ddfff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = isSel || near ? "#c9faff" : "#62cadd";
        ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText(n.id, n.x, n.y + r + 13);
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [nodes, edges, sel, view, neighbours]);

  const toWorld = (cx: number, cy: number) => {
    const c = canvas.current!;
    const fit = Math.min(c.clientWidth, c.clientHeight) / 420;
    return {
      x: (cx - c.clientWidth / 2 - view.x) / (fit * view.k),
      y: (cy - c.clientHeight / 2 - view.y) / (fit * view.k),
    };
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
            if (!d) return;
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
            const p = toWorld(e.clientX - r.left, e.clientY - r.top);
            let best = -1;
            let bd = 26 * 26;
            nodes.forEach((n, i) => {
              const dd = (n.x - p.x) ** 2 + (n.y - p.y) ** 2;
              if (dd < bd) {
                bd = dd;
                best = i;
              }
            });
            if (best >= 0) setSel(best);
          }}
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
        <h4 className="jv-hashHead">
          SOURCES{" "}
          <small>
            {nodes.length} · {edges.length} links
          </small>
        </h4>
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
