/**
 * TOUR <GO>: a guided glide through the home page, one section at a time,
 * with a caption card. About 40 seconds end to end.
 *
 * - Any key, wheel, touch or click outside the card stops it (the visitor is
 *   always in charge); the card has its own Stop button and Esc works too.
 * - Under reduced motion it jumps instead of gliding.
 * - From another page it hops to the home page first and resumes there.
 */

const PENDING = "ayan:tour";

type Step = { sel: string; title: string; line: string; ms?: number };

const STEPS: Step[] = [
  {
    sel: "#top",
    title: "Ayan Bhardwaj",
    line: "Software engineer at the point where AI meets money. CS + Business Honors at UT Austin.",
    ms: 4200,
  },
  {
    sel: "#about",
    title: "About",
    line: "Fast search, honest research tools, and agents that know when not to hit send.",
  },
  {
    sel: "#experience",
    title: "Experience",
    line: "Moss and Koyal AI (both YC F25), and NLP research at UNT.",
  },
  {
    sel: "#project-youbank",
    title: "YouBank, the flagship",
    line: "An AI deal desk: cited analysis from SEC filings, a live Studio, an email agent that earns autopilot.",
    ms: 5200,
  },
  {
    sel: "#projects",
    title: "Built at Moss, and beyond",
    line: "10 open-source apps on Moss's semantic search SDK, plus hackathon builds and research.",
  },
  {
    sel: "#trophies",
    title: "Leadership & recognition",
    line: "CSB Honors, Startup School, the Fed Challenge, and a 200+ member nonprofit he founded.",
  },
  {
    sel: "#activity",
    title: "Shipping, in public",
    line: "A year of public GitHub activity as a skyline.",
  },
  {
    sel: "#contact",
    title: "Let's build something",
    line: "Email is fastest. Or press ⌘J and ask ayan-bot anything about his work.",
    ms: 5200,
  },
];

const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let running: (() => void) | null = null;

/** Start the tour (or hop home and start there). Calling it again stops it. */
export function tour() {
  if (running) {
    running();
    return;
  }
  if (window.location.pathname !== "/") {
    try {
      sessionStorage.setItem(PENDING, "1");
    } catch {
      /* no storage: just go home */
    }
    // A full load (not client routing): the home page then resumes the tour.
    window.location.assign(new URL("/", window.location.origin).href);
    return;
  }
  start();
}

/** Called on the home page: resumes a tour requested from another page. */
export function resumeTourIfPending() {
  let pending = false;
  try {
    pending = sessionStorage.getItem(PENDING) === "1";
    sessionStorage.removeItem(PENDING);
  } catch {
    /* ignore */
  }
  if (pending) window.setTimeout(start, 900);
}

function start() {
  const steps = STEPS.filter((s) => document.querySelector(s.sel));
  if (!steps.length) return;

  const card = document.createElement("div");
  card.className = "fx-tour";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", "Guided tour");
  card.setAttribute("aria-live", "polite");
  const count = document.createElement("p");
  count.className = "fx-tour-count";
  const title = document.createElement("p");
  title.className = "fx-tour-title";
  const line = document.createElement("p");
  line.className = "fx-tour-line";
  const bar = document.createElement("span");
  bar.className = "fx-tour-bar";
  bar.setAttribute("aria-hidden", "true");
  const stopBtn = document.createElement("button");
  stopBtn.type = "button";
  stopBtn.className = "fx-tour-stop";
  stopBtn.textContent = "Stop tour";
  card.append(count, title, line, stopBtn, bar);
  document.body.appendChild(card);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => card.setAttribute("data-on", "")),
  );

  let i = 0;
  let timer = 0;
  const behavior: ScrollBehavior = reduced() ? "auto" : "smooth";

  const show = () => {
    const s = steps[i];
    document.querySelector(s.sel)?.scrollIntoView({
      behavior,
      block: "start",
    });
    count.textContent = `${String(i + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}  ·  TOUR <GO>`;
    title.textContent = s.title;
    line.textContent = s.line;
    const ms = s.ms ?? 4400;
    bar.style.setProperty("--d", `${ms}ms`);
    bar.removeAttribute("data-run");
    void bar.offsetWidth; // restart the progress animation
    bar.setAttribute("data-run", "");
    timer = window.setTimeout(() => {
      i++;
      if (i >= steps.length) stop();
      else show();
    }, ms);
  };

  const onUser = (e: Event) => {
    if (e.target instanceof Node && card.contains(e.target)) return;
    stop();
  };
  const onKey = (e: KeyboardEvent) => {
    if (
      e.target instanceof Node &&
      card.contains(e.target) &&
      e.key !== "Escape"
    )
      return;
    stop();
  };

  function stop() {
    window.clearTimeout(timer);
    window.removeEventListener("wheel", onUser, true);
    window.removeEventListener("touchstart", onUser, true);
    window.removeEventListener("pointerdown", onUser, true);
    window.removeEventListener("keydown", onKey, true);
    card.removeAttribute("data-on");
    window.setTimeout(() => card.remove(), 400);
    running = null;
  }

  stopBtn.addEventListener("click", stop);
  // Listen from the next tick, so the click/Enter that started us doesn't stop us.
  window.setTimeout(() => {
    window.addEventListener("wheel", onUser, { capture: true, passive: true });
    window.addEventListener("touchstart", onUser, {
      capture: true,
      passive: true,
    });
    window.addEventListener("pointerdown", onUser, true);
    window.addEventListener("keydown", onKey, true);
  }, 300);

  running = stop;
  show();
}
