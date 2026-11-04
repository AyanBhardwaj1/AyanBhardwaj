"use client";

import { useState } from "react";
import { s } from "./styles";

const CARDS = [
  {
    f: "Where does the parent of index k sit in a binary heap?",
    b: "At k / 2, with the array starting at index 1.",
  },
  {
    f: "What does Dijkstra's algorithm keep in its priority queue?",
    b: "Vertices keyed by their best known distance so far.",
  },
  {
    f: "Running time of building a heap bottom-up?",
    b: "O(n), not O(n log n).",
  },
];

/** Stack's published intervals for each grade. */
const GRADES = [
  { label: "Again", when: "10 min", days: 0 },
  { label: "Hard", when: "1 day", days: 1 },
  { label: "Good", when: "4 days", days: 4 },
  { label: "Easy", when: "9 days", days: 9 },
];

export function Flashcard() {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [placed, setPlaced] = useState<
    { card: number; days: number; label: string }[]
  >([]);
  const card = CARDS[i % CARDS.length];
  const last = placed.at(-1);

  return (
    <div className={s.flash} data-ui="">
      <button
        type="button"
        className={s.cardFace}
        data-flipped={flipped}
        onClick={() => setFlipped((v) => !v)}
        aria-label={
          flipped
            ? `Answer: ${card.b} Show the question.`
            : `Question: ${card.f} Show the answer.`
        }
      >
        <span className={s.cardSide} aria-hidden={flipped}>
          <span className={s.cardHint}>Question · tap to flip</span>
          {card.f}
        </span>
        <span className={`${s.cardSide} ${s.cardBack}`} aria-hidden={!flipped}>
          <span className={s.cardHint}>Answer</span>
          {card.b}
        </span>
      </button>

      <div
        className={s.grades}
        role="group"
        aria-label="How well did you know it?"
      >
        {GRADES.map((g) => (
          <button
            key={g.label}
            type="button"
            disabled={!flipped}
            onClick={() => {
              setPlaced((p) => [
                ...p.slice(-5),
                { card: i, days: g.days, label: g.label },
              ]);
              setI((v) => v + 1);
              setFlipped(false);
            }}
          >
            <span>{g.label}</span>
            <small>{g.when}</small>
          </button>
        ))}
      </div>
      <p className={s.flashMsg} aria-live="polite">
        {last
          ? `${last.label}: this card comes back ${last.days === 0 ? "in 10 minutes" : `in ${last.days} day${last.days === 1 ? "" : "s"}`}.`
          : "Flip the card, then grade yourself."}
      </p>

      <div className={s.timeline} aria-hidden="true">
        {Array.from({ length: 14 }, (_, d) => (
          <span key={d} className={s.tick}>
            {d === 0 ? "Today" : d % 2 === 0 ? `+${d}` : ""}
            {placed
              .filter((p) => p.days === d)
              .map((p, k) => (
                <i key={`${p.card}-${k}`} className={s.dot}>
                  {(p.card % CARDS.length) + 1}
                </i>
              ))}
          </span>
        ))}
      </div>
    </div>
  );
}
