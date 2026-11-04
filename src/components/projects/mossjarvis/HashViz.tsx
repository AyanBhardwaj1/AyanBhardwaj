"use client";

import { useId, useMemo, useState } from "react";
import { DIMS, cosine, features, localEmbedding, place } from "./embed";
import "./jarvis.css";

const COLS = 24;

/**
 * "How a thought becomes 384 numbers": the app's real hashing embedding,
 * run live. Each feature lands in one of 384 buckets with a +/- sign.
 */
export function HashViz() {
  const [a, setA] = useState("launch plan");
  const [b, setB] = useState("launched the plans");
  const [hover, setHover] = useState<number | null>(null);
  const idA = useId();
  const idB = useId();

  const placed = useMemo(() => features(a).slice(0, 60).map(place), [a]);
  const vec = useMemo(() => localEmbedding(a), [a]);
  const sim = useMemo(() => cosine(vec, localEmbedding(b)), [vec, b]);
  const used = vec.filter((v) => v !== 0).length;
  const max = Math.max(...vec.map(Math.abs)) || 1;
  const hot = hover === null ? null : placed[hover]?.bucket;

  return (
    <div className="jv-hash">
      <div className="jv-hashInputs">
        <label htmlFor={idA}>THOUGHT</label>
        <input
          id={idA}
          value={a}
          maxLength={60}
          spellCheck={false}
          onChange={(e) => setA(e.target.value)}
        />
        <label htmlFor={idB}>COMPARE WITH</label>
        <input
          id={idB}
          value={b}
          maxLength={60}
          spellCheck={false}
          onChange={(e) => setB(e.target.value)}
        />
        <p className="jv-sim" aria-live="polite">
          COSINE <b>{sim.toFixed(3)}</b>
          <small>
            shared trigrams like ^la, lau, aun still match across word forms
          </small>
        </p>
      </div>

      <div>
        <h3 className="jv-hashHead">
          1 · FEATURES <small>{features(a).length} (words + trigrams)</small>
        </h3>
        <ul className="jv-feats">
          {placed.map((p, i) => (
            <li key={p.feature + i}>
              <button
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                data-sign={p.sign > 0 ? "+" : "-"}
              >
                {p.feature}
                <span className="sr-only">
                  {` goes to bucket ${p.bucket}, sign ${p.sign > 0 ? "plus" : "minus"}`}
                </span>
                <small aria-hidden="true">
                  →{p.bucket}
                  {p.sign > 0 ? "+" : "−"}
                </small>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="jv-hashHead">
          2 · 384 BUCKETS <small>{used} non-zero · L2-normalised</small>
        </h3>
        <div
          className="jv-cells"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          role="img"
          aria-label={`A ${DIMS}-cell grid; ${used} cells are non-zero.`}
        >
          {vec.map((v, i) => (
            <i
              key={i}
              data-sign={v > 0 ? "+" : v < 0 ? "-" : undefined}
              data-hot={hot === i ? "" : undefined}
              style={{ "--m": Math.abs(v) / max } as React.CSSProperties}
            />
          ))}
        </div>
        <p className="jv-vecLine">
          [
          {vec
            .map((v, i) => [v, i] as const)
            .filter(([v]) => v !== 0)
            .slice(0, 6)
            .map(([v, i]) => `${i}: ${v.toFixed(3)}`)
            .join(", ")}
          {used > 6 ? ", …" : ""}]
        </p>
      </div>
    </div>
  );
}
