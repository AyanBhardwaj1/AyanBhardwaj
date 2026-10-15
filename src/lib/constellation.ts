import { projects, type Project } from "@/content/content";
import {
  clusters,
  constellation,
  projectMnemonic,
  projectRepo,
  type ClusterId,
} from "@/content/extras";
import { starsFor } from "./github";

/**
 * Project constellation, laid out at build time (the page is prerendered, so
 * this never runs in the browser). Deterministic: no randomness, same input,
 * same picture.
 */

export type StarNode = {
  id: string;
  name: string;
  tagline: string;
  cluster: ClusterId;
  clusters: ClusterId[];
  stack: string[];
  stars?: number;
  href: string;
  mnemonic: string;
  significance: number;
  x: number;
  y: number;
  r: number;
};

export type StarEdge = {
  source: string;
  target: string;
  kind: "shared-stack" | "same-cluster" | "predicted";
  weight: number;
  reason: string;
};

export type ConstellationData = {
  width: number;
  height: number;
  nodes: StarNode[];
  edges: StarEdge[];
  predicted: StarEdge[];
  clusters: {
    id: ClusterId;
    label: string;
    x: number;
    y: number;
    count: number;
  }[];
};

const W = 960;
const H = 640;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\s+\d+(\.\d+)?$/, "")
    .trim();

/** Collapse near-duplicate stack labels so overlap means something. */
function stackSet(p: Project): Set<string> {
  const out = new Set<string>();
  for (const raw of p.stack) {
    let s = norm(raw);
    if (s.startsWith("moss")) s = "moss";
    if (s.includes("hooks")) s = "agent hooks";
    if (s === "postgresql") s = "postgres";
    out.add(s);
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

export function buildConstellation(): ConstellationData {
  const items = projects.filter((p) => constellation[p.id]);

  // 1. Seed: sunflower spiral around each cluster anchor, biggest stars in the middle.
  const nodes: StarNode[] = [];
  for (const c of clusters) {
    const members = items
      .filter((p) => constellation[p.id].clusters[0] === c.id)
      .sort(
        (a, b) =>
          constellation[b.id].significance - constellation[a.id].significance ||
          a.name.localeCompare(b.name),
      );
    members.forEach((p, i) => {
      const meta = constellation[p.id];
      const radius = i === 0 ? 0 : 50 * Math.sqrt(i) + 14;
      const theta = i * GOLDEN + c.anchor[0] / 97;
      nodes.push({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        cluster: c.id,
        clusters: meta.clusters,
        stack: p.stack,
        stars: starsFor(projectRepo[p.id]),
        href: p.links.live ?? p.links.code ?? "#projects",
        mnemonic: projectMnemonic[p.id] ?? p.id.slice(0, 4).toUpperCase(),
        significance: meta.significance,
        x: c.anchor[0] + radius * Math.cos(theta),
        y: c.anchor[1] + radius * Math.sin(theta),
        r: 3 + meta.significance * 2.2,
      });
    });
  }

  // 2. Relax: a few rounds of collision separation + pull to anchor. Deterministic.
  const anchorOf = new Map(clusters.map((c) => [c.id, c.anchor]));
  for (let iter = 0; iter < 160; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const min = a.r + b.r + (a.cluster === b.cluster ? 62 : 80);
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d === 0) {
          dx = 1;
          dy = 0;
          d = 1;
        }
        if (d < min) {
          const push = (min - d) / 2;
          a.x -= (dx / d) * push;
          a.y -= (dy / d) * push;
          b.x += (dx / d) * push;
          b.y += (dy / d) * push;
        }
      }
    }
    for (const n of nodes) {
      const [ax, ay] = anchorOf.get(n.cluster)!;
      n.x += (ax - n.x) * 0.006;
      n.y += (ay - n.y) * 0.006;
      n.x = Math.min(W - 60, Math.max(60, n.x));
      n.y = Math.min(H - 40, Math.max(50, n.y));
    }
  }
  for (const n of nodes) {
    n.x = Math.round(n.x * 10) / 10;
    n.y = Math.round(n.y * 10) / 10;
  }

  // 3. Edges: shared stack (top 3 per node) + secondary-cluster membership.
  const sets = new Map(items.map((p) => [p.id, stackSet(p)]));
  const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const edgeMap = new Map<string, StarEdge>();

  for (const a of nodes) {
    const scored = nodes
      .filter((b) => b.id !== a.id)
      .map((b) => {
        const sa = sets.get(a.id)!;
        const sb = sets.get(b.id)!;
        const shared = [...sa].filter((x) => sb.has(x));
        return { b, w: jaccard(sa, sb), shared };
      })
      .filter((s) => s.w >= 0.3 && s.shared.length >= 2)
      .sort((x, y) => y.w - x.w)
      .slice(0, 3);
    for (const s of scored) {
      const k = key(a.id, s.b.id);
      if (!edgeMap.has(k))
        edgeMap.set(k, {
          source: a.id,
          target: s.b.id,
          kind: "shared-stack",
          weight: Math.round(s.w * 100) / 100,
          reason: `shared stack: ${s.shared.slice(0, 3).join(", ")}`,
        });
    }
  }
  for (const n of nodes) {
    for (const extra of n.clusters.slice(1)) {
      const hub = nodes
        .filter((m) => m.cluster === extra)
        .sort((x, y) => y.significance - x.significance)[0];
      if (!hub || hub.id === n.id) continue;
      const k = key(n.id, hub.id);
      if (!edgeMap.has(k))
        edgeMap.set(k, {
          source: n.id,
          target: hub.id,
          kind: "same-cluster",
          weight: 0.5,
          reason: `also part of ${clusters.find((c) => c.id === extra)?.label}`,
        });
    }
  }
  const edges = [...edgeMap.values()];

  // 4. Predicted links: Adamic-Adar over the real graph, top 8 non-adjacent pairs.
  const nbrs = new Map<string, Set<string>>(
    nodes.map((n) => [n.id, new Set()]),
  );
  for (const e of edges) {
    nbrs.get(e.source)!.add(e.target);
    nbrs.get(e.target)!.add(e.source);
  }
  const predicted: StarEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i].id;
      const b = nodes[j].id;
      if (nbrs.get(a)!.has(b)) continue;
      const common = [...nbrs.get(a)!].filter((z) => nbrs.get(b)!.has(z));
      if (!common.length) continue;
      const score = common.reduce(
        (s, z) => s + 1 / Math.log(Math.max(nbrs.get(z)!.size, 2)),
        0,
      );
      predicted.push({
        source: a,
        target: b,
        kind: "predicted",
        weight: Math.round(score * 100) / 100,
        reason: `via ${common.map((z) => nodes.find((n) => n.id === z)!.name).join(", ")}`,
      });
    }
  }
  predicted.sort(
    (x, y) => y.weight - x.weight || x.source.localeCompare(y.source),
  );

  return {
    width: W,
    height: H,
    nodes,
    edges,
    predicted: predicted.slice(0, 8),
    clusters: clusters.map((c) => {
      const members = nodes.filter((n) => n.cluster === c.id);
      const top = Math.min(...members.map((n) => n.y - n.r));
      const cx = members.reduce((s, n) => s + n.x, 0) / (members.length || 1);
      return {
        id: c.id,
        label: c.label,
        x: Math.round(cx),
        y: Math.round(top - 26),
        count: members.length,
      };
    }),
  };
}
