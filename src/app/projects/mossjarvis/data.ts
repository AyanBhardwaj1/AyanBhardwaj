/** Copy for /projects/mossjarvis. Accurate to the mossJARVIS README and source. */

export const data = {
  intro:
    "A text-first assistant with a compact Iron Man HUD and a persistent second brain. Moss handles recall, OpenRouter handles generation, and it ships as a frameless, always-on-top macOS overlay with Node bundled inside.",
  noLive:
    "There's no hosted demo: it runs on localhost or as a locally built Jarvis.app. The HUD below is a recreation that runs in your browser. Recall and scoring are real, the replies are scripted.",

  overview: [
    "mossJARVIS runs in the browser or as a Tauri 2 overlay that floats above everything else. Type a directive, press TRANSMIT. It needs three credentials: a Moss project ID and key, and an OpenRouter key. Any OpenRouter chat model works.",
    "The point is memory that doesn't fall over. Every turn is written to private local storage first, then to Moss's local index, then synced to Moss Cloud when quota allows. If the cloud is down or the monthly quota runs out, the HUD switches to MOSS LOCAL and recall keeps working.",
  ],
  facts: [
    ["Built at", "Moss · YC F25"],
    ["Runs as", "Browser app or Tauri overlay"],
    ["Memory", "Moss local + cloud sync"],
    ["Models", "Any OpenRouter model"],
    ["Embeddings", "384-d hashed, on device"],
  ] as [string, string][],

  pipeline: [
    [
      "Directive in",
      "Typed in the command bar, or spoken after the wake word.",
    ],
    [
      "Dual recall",
      "Working memory (top 5, token overlap with a recency tiebreak) and the Moss local index (top 5) are searched in parallel.",
    ],
    [
      "Context out",
      "Results are labelled working or long-term and sent to OpenRouter with the directive.",
    ],
    [
      "Strict JSON back",
      "The model answers with { response, facts[], tasks[] }, validated before anything is stored. Prose answers still show; extraction is skipped.",
    ],
    [
      "Disk first",
      "The turn lands in .jarvis-data/second-brain.json (atomic write, mode 0600).",
    ],
    [
      "Moss local",
      "Then into a Moss SessionIndex, saved to second-brain.moss.",
    ],
    [
      "Moss Cloud",
      "Then addDocs + loadIndex on jarvis-second-brain, if quota allows. A failure here loses nothing.",
    ],
  ] as [string, string][],

  embeddingNote:
    "No embedding API, no model download. localEmbedding() turns text into word features (w:launch) and character trigrams of ^word$, hashes each one FNV-1a style into one of 384 buckets with a sign from a second hash, and L2-normalises the result. Those vectors go to Moss as custom embeddings, so retrieval works even when hosted embedding quota is gone. The visualiser below runs that exact function.",

  brainTabs: [
    [
      "Memories",
      "Semantic search, type filters, an optional recency re-rank (half-life 45 days: 0.45 + 0.55·e^(-age/45)), full text, semantic neighbours, delete a vector.",
    ],
    [
      "Graph",
      "A source-level knowledge graph from the embeddings. Each source keeps its 6 strongest neighbours; edges under 0.08 cosine are dropped.",
    ],
    [
      "Ingest",
      "Markdown, text, reStructuredText, Org, CSV, logs, HTML, PDF, Word, ChatGPT and Claude exports, public articles, YouTube transcripts.",
    ],
    [
      "Remember",
      "Write a fact, decision, preference or event straight into memory, no model call.",
    ],
  ] as [string, string][],
  ingestNote:
    "Chunks are heading-aware and capped near 3,600 characters, with deterministic IDs (source + section + part), so re-importing a file updates it instead of duplicating it. Prompt-role markers are neutralised and private-network URLs are rejected. Limits: 25 MB a file, 60 MB a batch.",
  graphNote:
    "Demo sources, embedded and linked with the same rules in your browser. Drag to pan, use the buttons (or pinch) to zoom, pick a source to inspect it.",

  features: [
    {
      code: "TASK MATRIX",
      title: "Tasks and a morning briefing",
      body: "Extracted tasks are stored as Moss documents with type, status, due date, recurrence and priority. BRIEFING reads the open ones and asks for a short briefing: overdue first, then due today, then high priority. With no open tasks it answers without calling a model.",
    },
    {
      code: "VOICE MATRIX",
      title: "Voice when you want it",
      body: "Picovoice Porcupine listens for “Jarvis” on device, Cheetah streams speech to text and ends after about 1.15 s of silence, and ElevenLabs speaks the reply. It switches on only when those keys exist; text needs just Moss and OpenRouter.",
    },
    {
      code: "OVERLAY",
      title: "A real desktop overlay",
      body: "A Tauri 2 window: frameless, transparent, resizable, always on top, dragged by the HUD title bar. Jarvis.app bundles the Next.js standalone server, Moss's native Apple Silicon module and the Node executable. A Rust launcher starts and owns the server on 127.0.0.1.",
    },
    {
      code: "STATE MACHINE",
      title: "A HUD that shows its work",
      body: "booting, idle, listening, thinking, speaking, offline, each with its own reactor animation. Telemetry shows Moss query latency and how many vectors were recalled. Missing credentials or an API error turn the whole HUD red.",
    },
  ],

  build: [
    "One API route, POST /api/jarvis, with actions for status, models, init, turn, chat, briefing, memory search and the brain workspace; plus /api/jarvis/tts and a multipart /api/jarvis/brain/ingest.",
    "The working buffer keeps the latest 40 raw turns, and every exchange also becomes a durable conversation-summary document. Document types: system, conversation-turn, conversation-summary, fact, task.",
    "Voice runs Porcupine and Cheetah through their Web SDKs in workers. If ElevenLabs fails, it falls back to the OS en-GB voice.",
  ],
  credit:
    "Adapts the architecture and ingestion ideas of moss-brain by Aarush Nigam (MIT license), reimplemented natively in TypeScript.",
  creditHref: "https://github.com/Naut1cal5/moss-brain",
};
