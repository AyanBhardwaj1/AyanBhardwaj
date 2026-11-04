"use client";

import { useId, useState } from "react";
import { s } from "./styles";

/** A fixed note and three questions graded against it, like Stack's "Quiz me". */
export const NOTE = [
  "A binary heap is a complete binary tree stored in an array.",
  "In a min-heap, every parent is less than or equal to its children.",
  "With the array starting at index 1, the children of k sit at 2k and 2k + 1, and the parent of k sits at k / 2.",
  "Insert puts the new item at the end and swims it up; removing the minimum moves the last item to the top and sinks it down.",
  "Both operations take O(log n) time, because the tree's height is log n.",
];

const QUESTIONS = [
  {
    q: "Where does the parent of the node at index k sit?",
    keys: [/k\s*\/\s*2/, /\bhalf\b/, /\bk\s*div(ided)?\s*(by)?\s*2\b/, /floor/],
    line: 2,
  },
  {
    q: "After insert puts the item at the end, what happens to it?",
    keys: [/\bswim/, /\bup\b/, /bubble/, /sift\s*up/, /percolate/],
    line: 3,
  },
  {
    q: "How long does removing the minimum take?",
    keys: [/log/],
    line: 4,
  },
];

export function QuizMe() {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [cards, setCards] = useState(0);
  const id = useId();
  const cur = QUESTIONS[i];

  const grade = () => {
    if (!answer.trim()) return;
    const a = answer.toLowerCase();
    const ok = cur.keys.some((k) => k.test(a));
    setResult(ok);
    if (!ok) setCards((c) => c + 1);
  };

  const next = () => {
    setI((v) => (v + 1) % QUESTIONS.length);
    setAnswer("");
    setResult(null);
  };

  return (
    <div className={s.quiz} data-ui="">
      <article className={s.noteDoc} aria-label="Note: Lecture 14, Heaps">
        <p className={s.crumb}>CS 61B › Lectures</p>
        <h3 className={s.noteTitle}>Lecture 14: Heaps</h3>
        <ul>
          {NOTE.map((line, n) => (
            <li
              key={n}
              className={result !== null && n === cur.line ? s.hit : undefined}
            >
              {line}
            </li>
          ))}
        </ul>
      </article>

      <div className={s.quizCard}>
        <p className={s.quizTop}>
          <span>
            Quiz me · {i + 1} of {QUESTIONS.length}
          </span>
          <span className={cards ? s.deckBump : s.deck} key={cards}>
            Flashcards +{cards}
          </span>
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (result === null) grade();
            else next();
          }}
        >
          <label htmlFor={id} className={s.quizQ}>
            {cur.q}
          </label>
          <input
            id={id}
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (result !== null) setResult(null);
            }}
            placeholder="Type your answer"
            autoComplete="off"
            className={s.quizInput}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {result === null ? (
              <button type="submit" className={s.btn} disabled={!answer.trim()}>
                Check answer
              </button>
            ) : (
              <button type="submit" className={s.btn}>
                Next question
              </button>
            )}
          </div>
        </form>
        <div aria-live="polite">
          {result === true && (
            <p className={s.right}>
              <strong>Correct.</strong> Your note says: &ldquo;
              {NOTE[cur.line]}&rdquo;
            </p>
          )}
          {result === false && (
            <p className={s.wrong}>
              <strong>Not quite.</strong> Your note says: &ldquo;
              {NOTE[cur.line]}&rdquo; <em>Added to Flashcards.</em>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
