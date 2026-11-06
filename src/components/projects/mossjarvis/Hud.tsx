"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cosine, localEmbedding } from "./embed";
import {
  LONG_TERM,
  PRESETS,
  START_TASKS,
  STOPWORDS,
  WORKING,
  type Memory,
  type Task,
} from "./hud-data";
import "./jarvis.css";

type CoreState = "idle" | "listening" | "thinking" | "speaking";
type Step = "pending" | "ok" | "fail";
type Hit = Memory & { score: number; layer: "working" | "long-term" };

const STATES: CoreState[] = ["idle", "listening", "thinking", "speaking"];

const CAPTION: Record<CoreState, [string, string]> = {
  idle: ["TEXT INTERFACE // READY", "ARC REACTOR // MK VII"],
  listening: ["WAKE SIGNATURE ACK", "LISTENING // CHEETAH STT"],
  thinking: ["QUERYING DUAL MEMORY LAYERS", "WORKING + LONG-TERM // TOP 5"],
  speaking: ["TRANSMITTING RESPONSE", "VOICE // ELEVENLABS"],
};

const LOAD: Record<CoreState, number> = {
  idle: 36,
  listening: 54,
  thinking: 82,
  speaking: 64,
};

const tokens = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

/** Working memory: token overlap, newest wins ties (as in the app). */
function searchWorking(q: string, pool: Memory[]): Hit[] {
  const qt = new Set(tokens(q));
  if (!qt.size) return [];
  return pool
    .map((m, i) => {
      const mt = new Set(tokens(m.text));
      let n = 0;
      qt.forEach((t) => mt.has(t) && n++);
      return { ...m, score: n / qt.size, i, layer: "working" as const };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score || b.i - a.i)
    .slice(0, 5);
}

/** Long-term: cosine over the app's 384-d hashed embeddings. */
function searchLongTerm(q: string, pool: { m: Memory; v: number[] }[]): Hit[] {
  const qv = localEmbedding(q);
  return pool
    .map(({ m, v }) => ({
      ...m,
      score: cosine(qv, v),
      layer: "long-term" as const,
    }))
    .filter((h) => h.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

const mq = () => window.matchMedia("(prefers-reduced-motion: reduce)");
function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = mq();
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => mq().matches,
    () => false,
  );
}

const tick = (cb: () => void) => {
  const t = window.setInterval(cb, 1000);
  return () => window.clearInterval(t);
};
const fmtTime = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
const fmtDate = () =>
  new Date()
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })
    .toUpperCase();

function Clock() {
  const time = useSyncExternalStore(tick, fmtTime, () => "--:--:--");
  const date = useSyncExternalStore(tick, fmtDate, () => "LOCAL TIME");
  return (
    <div className="jv-clock">
      <strong>{time}</strong>
      <span>{date}</span>
    </div>
  );
}

export function Hud() {
  const reduce = useReducedMotion();
  const [state, setState] = useState<CoreState>("idle");
  const [offline, setOffline] = useState(false);
  const [quota, setQuota] = useState(false);
  const [alert, setAlert] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("BIOMETRIC LINK // VERIFIED");
  const [pipe, setPipe] = useState({ audio: 0, memory: 0, response: 0 });
  const [hits, setHits] = useState<{ w: Hit[]; l: Hit[] } | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [typed, setTyped] = useState("");
  const [json, setJson] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [tasks, setTasks] = useState<Task[]>(START_TASKS);
  const [working, setWorking] = useState<Memory[]>(WORKING);
  const [extraLong, setExtraLong] = useState<Memory[]>([]);
  const [lastSync, setLastSync] = useState<"cloud" | "local" | null>(null);
  const timers = useRef<number[]>([]);
  const hudRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  // Pause the reactor's infinite spins while the HUD is off screen.
  useEffect(() => {
    const el = hudRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.removeAttribute("data-idle");
      else el.setAttribute("data-idle", "");
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const longPool = useMemo(
    () =>
      [...LONG_TERM, ...extraLong].map((m) => ({
        m,
        v: localEmbedding(m.text),
      })),
    [extraLong],
  );
  const memCount = working.length + LONG_TERM.length + extraLong.length;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (ms: number, fn: () => void) => {
    if (reduce) fn();
    else timers.current.push(window.setTimeout(fn, ms));
  };

  function transmit(text: string) {
    const q = text.trim();
    if (!q || busy || offline) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const preset = PRESETS.find(
      (p) => p.prompt.toLowerCase() === q.toLowerCase(),
    );

    const t0 = performance.now();
    const w = searchWorking(q, working);
    const l = searchLongTerm(q, longPool);
    const ms = performance.now() - t0;

    const top = [...w, ...l].sort((a, b) => b.score - a.score)[0];
    const response = preset
      ? preset.response
      : `Demo mode: no model is attached to this page, so this reply is scripted. Recall is real: ${
          top
            ? `the closest memory is "${top.text}" (${top.score.toFixed(2)}).`
            : "nothing in memory matched yet."
        }`;
    const facts = preset?.facts ?? [];
    const newTasks = preset?.tasks ?? [];
    const payload = {
      response,
      facts,
      tasks: newTasks.map(({ title, due, recurrence, priority }) => ({
        title,
        due,
        recurrence,
        priority,
      })),
    };

    setBusy(true);
    setInput("");
    setHits(null);
    setReply("");
    setTyped("");
    setJson(null);
    setSteps(null);
    setLatency(null);
    setState("thinking");
    setStatus("QUERYING DUAL MEMORY LAYERS");
    setPipe({ audio: 100, memory: 0, response: 0 });

    later(120, () => setPipe((p) => ({ ...p, memory: 100 })));
    later(520, () => {
      setHits({ w, l });
      setLatency(ms);
      setStatus("ROUTING CONTEXT // OPENROUTER");
    });
    later(1000, () => {
      setState("speaking");
      setStatus("TRANSMITTING RESPONSE");
      setPipe((p) => ({ ...p, response: 100 }));
      setReply(response);
      if (reduce) setTyped(response);
      else {
        let i = 0;
        const step = Math.max(1, Math.ceil(response.length / 60));
        const iv = window.setInterval(() => {
          i += step;
          setTyped(response.slice(0, i));
          if (i >= response.length) window.clearInterval(iv);
        }, 22);
        timers.current.push(iv);
      }
    });
    const done = reduce ? 0 : 1000 + 60 * 22 + 120;
    later(done, () => {
      setJson(JSON.stringify(payload, null, 2));
      setSteps(["ok", "pending", "pending"]);
    });
    later(done + 220, () => setSteps(["ok", "ok", "pending"]));
    later(done + 520, () => {
      setSteps(["ok", "ok", quota ? "fail" : "ok"]);
      setLastSync(quota ? "local" : "cloud");
      if (quota) {
        setAlert(true);
        later(900, () => setAlert(false));
      }
      setWorking((prev) => [
        ...prev.slice(-39),
        { id: `t-${Date.now()}`, type: "conversation-turn", text: q },
      ]);
      if (facts.length)
        setExtraLong((prev) => [
          ...prev,
          ...facts.map((f, i) => ({
            id: `f-${Date.now()}-${i}`,
            type: "fact" as const,
            text: f,
          })),
        ]);
      if (newTasks.length)
        // Upsert: asking twice refreshes the task instead of
        // adding a duplicate.
        setTasks((prev) => {
          const key = (t: Task) => `${t.title}|${t.due ?? ""}`;
          const fresh = new Set(newTasks.map(key));
          return [
            ...newTasks.map((t) => ({ ...t, isNew: true })),
            ...prev
              .filter((t) => !fresh.has(key(t)))
              .map((t) => ({ ...t, isNew: false })),
          ];
        });
      setState("idle");
      setStatus(
        quota
          ? "TEXT RESPONSE READY // MOSS LOCAL SAVED"
          : "TEXT RESPONSE READY // MOSS CLOUD SYNCED",
      );
      setBusy(false);
    });
  }

  function briefing() {
    if (busy || offline) return;
    const open = [...tasks].sort(
      (a, b) =>
        ["high", "medium", "low"].indexOf(a.priority) -
        ["high", "medium", "low"].indexOf(b.priority),
    );
    const text = open.length
      ? `Briefing (simulated): ${open.length} open task${open.length > 1 ? "s" : ""}. Start with "${open[0].title}" (${open[0].priority}, due ${open[0].due ?? "unscheduled"}).`
      : "No open tasks. Nothing is overdue. (With no open tasks the app returns this without calling a model.)";
    setReply(text);
    setTyped(text);
    setHits(null);
    setJson(null);
    setSteps(null);
    setStatus("MORNING BRIEFING // READY");
  }

  const coreLabel = offline ? "OFFLINE" : state.toUpperCase();
  const [cap, sub] = offline
    ? ["OFFLINE // CHECK CREDENTIALS", "MOSS + OPENROUTER KEYS MISSING"]
    : CAPTION[state];
  const load = offline ? 0 : LOAD[state];
  const link = quota ? "MOSS LOCAL" : "MOSS CLOUD";

  return (
    <div
      ref={hudRef}
      className="jv-hud"
      data-inview=""
      data-state={state}
      data-offline={offline || alert ? "" : undefined}
    >
      <div className="jv-fx" aria-hidden="true" />

      {/* Top bar */}
      <div className="jv-topbar">
        <div className="jv-brand">
          <span className="jv-diamond" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <b>J.A.R.V.I.S.</b>
            <small>JUST A RATHER VERY INTELLIGENT SYSTEM</small>
          </span>
        </div>
        <p className="jv-telemetry">
          <span>{offline ? "CORE FAULT" : "CORE NOMINAL"}</span>
          <span>MEM {String(memCount).padStart(4, "0")}</span>
          <span>LINK TEXT</span>
          <span className={quota ? "jv-warnText" : "jv-okText"}>{link}</span>
        </p>
      </div>

      <div className="jv-grid">
        {/* Left rail */}
        <div className="jv-rail">
          <section className="jv-panel" aria-labelledby="hud-diag">
            <h3 id="hud-diag" className="jv-panelTitle">
              SYSTEM DIAGNOSTICS
            </h3>
            <div
              className="jv-gauge"
              style={{ "--load": load } as React.CSSProperties}
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={load}
              aria-label="Neural load"
            >
              <b>{load}%</b>
              <small>NEURAL LOAD</small>
            </div>
            <dl className="jv-metrics">
              <div>
                <dt>MOSS LATENCY</dt>
                <dd>{latency === null ? "--" : `${latency.toFixed(2)} MS`}</dd>
                <dd aria-hidden="true" className="jv-barCell">
                  <i
                    style={
                      {
                        "--p": latency === null ? 0 : 0.7,
                      } as React.CSSProperties
                    }
                  />
                </dd>
              </div>
              <div>
                <dt>MEMORY RECALL</dt>
                <dd>
                  {hits ? `${hits.w.length + hits.l.length} VECTORS` : "--"}
                </dd>
                <dd aria-hidden="true" className="jv-barCell">
                  <i
                    style={
                      {
                        "--p": hits ? (hits.w.length + hits.l.length) / 10 : 0,
                      } as React.CSSProperties
                    }
                  />
                </dd>
              </div>
              <div>
                <dt>VOICE MATRIX</dt>
                <dd>TEXT ONLY</dd>
                <dd aria-hidden="true" className="jv-barCell">
                  <i style={{ "--p": 0.12 } as React.CSSProperties} />
                </dd>
              </div>
            </dl>
            <p className="jv-note">
              Latency is measured in your browser over the demo memories.
            </p>
          </section>

          <section className="jv-panel" aria-labelledby="hud-ctl">
            <h3 id="hud-ctl" className="jv-panelTitle">
              CORE STATE
            </h3>
            <div className="jv-stateBtns">
              {STATES.map((st) => (
                <button
                  key={st}
                  type="button"
                  className="jv-outline"
                  aria-pressed={!offline && state === st}
                  disabled={busy}
                  onClick={() => {
                    setOffline(false);
                    setState(st);
                  }}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`jv-outline jv-full`}
              aria-pressed={offline}
              disabled={busy}
              onClick={() => setOffline((v) => !v)}
            >
              {offline ? "RESTORE LINK" : "SIMULATE OFFLINE"}
            </button>
            <button
              type="button"
              className={`jv-outline jv-full`}
              disabled={busy || offline}
              onClick={briefing}
            >
              MORNING BRIEFING
            </button>
          </section>
        </div>

        {/* Core stage */}
        <div className="jv-stage">
          <div className="jv-brackets" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="jv-hair" aria-hidden="true" />
          <button
            type="button"
            className="jv-reactor"
            disabled={busy || offline}
            onClick={() =>
              setState(STATES[(STATES.indexOf(state) + 1) % STATES.length])
            }
          >
            <span className="sr-only">
              {`Arc reactor, state ${coreLabel}. Activate to cycle the state.`}
            </span>
            <span className="jv-orbitA" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="jv-tickRing" aria-hidden="true" />
            <span className="jv-orbitB" aria-hidden="true" />
            <span className="jv-sweep" aria-hidden="true" />
            <span className="jv-orbitC" aria-hidden="true" />
            <span className="jv-core" aria-hidden="true">
              <span className="jv-hex">
                <b>J</b>
              </span>
              <em>{coreLabel}</em>
            </span>
          </button>
          <p className="jv-caption" aria-live="polite">
            <span className="jv-liveDot" aria-hidden="true" />
            <strong>{cap}</strong>
            <small>{sub}</small>
          </p>
          <div className="jv-pipeline">
            {(
              [
                ["AUDIO IN", pipe.audio],
                ["MEMORY", pipe.memory],
                ["RESPONSE", pipe.response],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <i style={{ "--p": v / 100 } as React.CSSProperties} />
                <b>{v}%</b>
              </div>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <div className="jv-rail">
          <section className="jv-panel" aria-labelledby="hud-time">
            <h3 id="hud-time" className="jv-panelTitle">
              CHRONOLOGY // LOCAL
            </h3>
            <Clock />
          </section>
          <section className="jv-panel" aria-labelledby="hud-tasks">
            <h3 id="hud-tasks" className="jv-panelTitle">
              TASK MATRIX <b>{tasks.length}</b>
            </h3>
            <ul className="jv-tasks">
              {tasks.map((t) => (
                <li
                  key={`${t.title}|${t.due ?? ""}`}
                  data-new={t.isNew ? "" : undefined}
                >
                  <i className={`jv-p_${t.priority}`} aria-hidden="true" />
                  <span>
                    <strong>{t.title}</strong>
                    <small>
                      {t.priority.toUpperCase()} PRIORITY
                      {t.recurrence ? ` · ${t.recurrence.toUpperCase()}` : ""}
                    </small>
                  </span>
                  <time>{t.due ?? "--"}</time>
                </li>
              ))}
            </ul>
          </section>
          <section className="jv-panel" aria-labelledby="hud-cloud">
            <h3 id="hud-cloud" className="jv-panelTitle">
              CUT THE CLOUD
            </h3>
            <button
              type="button"
              role="switch"
              aria-checked={quota}
              className="jv-switch"
              disabled={busy}
              onClick={() => setQuota((v) => !v)}
            >
              <span>MOSS CLOUD</span>
              <b>{quota ? "QUOTA EXCEEDED" : "SYNCED"}</b>
            </button>
            <ol
              className="jv-writes"
              aria-label="Write order for the last turn"
            >
              {[
                ["DISK", "second-brain.json · 0600"],
                ["MOSS LOCAL", "SessionIndex · second-brain.moss"],
                ["MOSS CLOUD", "addDocs + loadIndex"],
              ].map(([k, d], i) => {
                const st = steps?.[i];
                return (
                  <li key={k} data-step={st ?? "idle"}>
                    <span>
                      {i + 1} {k}
                    </span>
                    <small>
                      {st === "fail" ? "QUOTA · RETRY ON NEXT INIT" : d}
                    </small>
                    <b>
                      {st === "ok"
                        ? "✓ OK"
                        : st === "fail"
                          ? "✗ FAIL"
                          : st === "pending"
                            ? "…"
                            : ""}
                    </b>
                  </li>
                );
              })}
            </ol>
            {lastSync === "local" && (
              <p className="jv-note">
                Cloud write failed, nothing was lost: the turn is on disk and in
                the local index, and recall keeps working.
              </p>
            )}
          </section>
        </div>

        {/* Console */}
        <div className="jv-console">
          <form
            className="jv-command"
            onSubmit={(e) => {
              e.preventDefault();
              transmit(input);
            }}
          >
            <label htmlFor={inputId} className="jv-prompt">
              <span className="jv-promptWord">DIRECTIVE </span>&gt;
            </label>
            <input
              id={inputId}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={offline ? "LINK OFFLINE" : "Type a directive…"}
              autoComplete="off"
              spellCheck={false}
              disabled={offline}
              maxLength={200}
            />
            <button
              type="submit"
              className="jv-transmit"
              disabled={busy || offline || !input.trim()}
            >
              TRANSMIT
            </button>
          </form>
          <div
            className="jv-presets"
            role="group"
            aria-label="Example directives"
          >
            {PRESETS.map((p) => (
              <button
                key={p.prompt}
                type="button"
                className="jv-preset"
                disabled={busy || offline}
                onClick={() => transmit(p.prompt)}
              >
                {p.prompt}
              </button>
            ))}
          </div>
          <p className="jv-statusLine">
            <span aria-hidden="true">{"//"}</span> {status}
          </p>

          <div className="jv-reply">
            <span aria-hidden="true">
              {typed || (reply ? "" : "Awaiting directive.")}
            </span>
            <span className="sr-only" aria-live="polite">
              {typed === reply ? reply : ""}
            </span>
          </div>

          {hits && (
            <div className="jv-recall">
              {(
                [
                  ["WORKING", "recent turns · token overlap", hits.w],
                  ["LONG-TERM", "Moss local index · cosine", hits.l],
                ] as const
              ).map(([k, d, list]) => (
                <section key={k} aria-label={`${k} memory results`}>
                  <h4>
                    {k} <small>{d}</small>
                  </h4>
                  {list.length ? (
                    <ol>
                      {list.map((h) => (
                        <li key={h.id}>
                          <b>{h.score.toFixed(2)}</b>
                          <span>{h.text}</span>
                          <small>{h.type}</small>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="jv-note">No match in this layer.</p>
                  )}
                </section>
              ))}
            </div>
          )}

          {json && (
            <details className="jv-raw">
              <summary>RAW // JSON (validated before storing)</summary>
              <pre>{json}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
