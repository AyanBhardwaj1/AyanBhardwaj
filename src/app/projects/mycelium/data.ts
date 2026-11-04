import type { Media } from "@/content/extras";

/** Copy for /projects/mycelium. Accurate to the Mycelium README and source. */

export const data = {
  statement: "Your browser, with memory.",
  metaphor: "A spore for every page you finish.",
  intro:
    "Browser history works when you remember a title or a URL. Mycelium is for when you only remember the idea. It quietly turns the long articles you read into private semantic memory, then lets you search them by meaning from a command palette, and shows how they connect.",
  noLive:
    "Mycelium is an unpacked Chrome extension (Chrome 121+), not on the Web Store yet, so there's nothing to visit. The palette, ingestion and graph below are recreations that run on this page.",

  overview: [
    "After about 1.8 seconds on a page, and again when a single-page app changes URL, a content script runs Mozilla Readability. Only HTTP(S) pages with at least 500 readable words become memories, and a guard skips webmail, banking, checkout, payment and medical-record URLs. A stable URL hash means a revisit updates one memory instead of making a duplicate.",
    "Moss runs embedding and vector search in WebAssembly inside the extension. Captured pages sync to your Moss project so the durable index can be built; once that index is loaded, warm queries run locally with no network round trip. OpenRouter is optional and off by default.",
  ],
  facts: [
    ["Built at", "Moss · YC F25"],
    ["Platform", "Chrome extension (MV3)"],
    ["Retrieval", "Moss Web SDK, WASM"],
    ["Model", "moss-minilm"],
    ["Graph", "d3-force + Canvas 2D"],
  ] as [string, string][],

  ingestNote:
    "Each tab below runs the real gates: Readability, the 500-word floor, the sensitive-site guard and URL-hash dedupe. Pages that pass are written to chrome.storage.local immediately, then upserted to Moss.",
  searchNote:
    "⌘/Ctrl+K on any page (or ⌘/Ctrl+Shift+K, or the toolbar icon) opens the palette in an isolated Shadow DOM. Input is debounced 150 ms; up to eight ranked results come back with query-aware snippets, favicons, scores, the retrieval source and measured latency. The footer is honest about where answers came from: LOCAL WASM when Moss answered from the loaded index, LOCAL CACHE when a lexical fallback answered while Moss was warming up. Moss gets 1.2 s before it times out; the fallback can render after about 250 ms and is replaced when Moss hits arrive.",
  graphNote:
    "⌘/Ctrl+Shift+G opens graph.html: up to 300 pages, clustered by domain with stable colours, sized by revisits and search matches. Edges come from normalised shared-term overlap, kept above 0.08 and capped at five per node, and cached by data revision. Pan, zoom, drag, hover focus, graph search and a node inspector.",

  lanes: [
    [
      "Content script",
      "React + Shadow DOM. Readability after ~1.8 s, 500-word and sensitive-site gates, immediate chrome.storage.local write, the palette UI.",
    ],
    [
      "Service worker",
      "MV3 background: search orchestration and lexical fallback, settings, graph and summary caches, the OpenRouter queue, commands, offscreen lifecycle.",
    ],
    [
      "Offscreen document",
      "Owns @moss-dev/moss-web: createIndex, addDocs({ upsert: true }) in batches of 50, loadIndex, then in-browser query embedding and top-8 vector retrieval.",
    ],
    ["graph.html", "React + d3-force + Canvas 2D with an affinity-edge cache."],
  ] as [string, string][],
  archWhy:
    "Why an offscreen document: MV3 service workers are short-lived and can't host the Moss WASM stack, so a long-lived offscreen page owns the client and the loaded index. The background build is a single static file because dynamic imports are rejected there; Vite builds three targets (extension pages, the worker, an IIFE content script).",

  features: [
    {
      title: "Optional AI summaries",
      body: "Off by default. When on, OpenRouter (openrouter/free by default) writes one sentence under 20 words from the title and up to 12,000 characters, capped at 60 tokens, cached per URL and queued so it never blocks ingestion. Without it, Mycelium falls back to the title or snippet silently.",
    },
    {
      title: "Built for revisits",
      body: "Each memory tracks first and last visit, revisit count and how often it matched a search, which also drives node size in the graph.",
    },
    {
      title: "Local by default",
      body: "Text and metadata live in your Chrome profile with unlimitedStorage. Six storage keys hold pages, settings, summaries, the data revision, last sync and the graph cache.",
    },
  ],
  stackLine:
    "TypeScript, React, Chrome Extension MV3 (service worker, offscreen document, content scripts, commands), Moss Web SDK (WASM, moss-minilm), Mozilla Readability, d3-force, Canvas 2D, Vite, pnpm, OpenRouter (optional).",

  promo: [
    {
      src: "/media/projects/mycelium/demo-title-scene.jpg",
      alt: "Title card from Mycelium's promo video: a violet glow behind the words “Your browser, with memory.” and a Powered by Moss pill",
      width: 1600,
      height: 900,
    },
    {
      src: "/media/mycelium/search.jpg",
      alt: "Frame from Mycelium's promo video: three ingested article cards with violet progress bars and the caption “Every article becomes memory.”",
      width: 1600,
      height: 900,
    },
    {
      src: "/media/mycelium/graph.jpg",
      alt: "Frame from Mycelium's promo video: the search palette returning ranked pages for “self-improving AI agents”",
      width: 1600,
      height: 900,
    },
    {
      src: "/media/projects/mycelium/demo-graph-scene.jpg",
      alt: "Frame from Mycelium's promo video: read pages connected as a knowledge graph around an AI agents hub",
      width: 1600,
      height: 900,
    },
  ] as Media[],
  promoNote:
    "Frames from the 27-second promo video in the repo, rendered programmatically with Python and Pillow. They're stylised, not screen recordings, and the latency figures in them are illustrative.",
};
