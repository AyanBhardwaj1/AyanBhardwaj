/**
 * A fixed demo library of "read" pages for the in-page palette and graph.
 * Titles are invented; the ranking rules (affinity >= 0.08, <= 5 edges per
 * node, domain colours) follow Mycelium's source.
 */

export const DOMAIN_COLORS = [
  "#9c76ff",
  "#5aa9f8",
  "#55d6a9",
  "#e68bc3",
  "#e2aa5d",
  "#6ed3e6",
  "#b6d56b",
  "#ef7f79",
];

export const DOMAINS = [
  "dev.to",
  "arxiv.org",
  "medium.com",
  "github.blog",
  "simonwillison.net",
  "lilianweng.github.io",
  "web.dev",
  "martinfowler.com",
];

export type Page = {
  id: number;
  title: string;
  domain: string;
  words: number;
  revisits: number;
  matches: number;
  tags: string[];
  excerpt: string;
};

const raw: [string, number, string[], string][] = [
  [
    "Building agents that remember across sessions",
    0,
    ["agents", "memory", "long-term", "context", "remember"],
    "Persisting what an agent learned so the next session starts warm.",
  ],
  [
    "Self-improving AI agents with reflection loops",
    1,
    ["agents", "self-improving", "reflection", "evaluation"],
    "Agents critique their own traces and rewrite their plans.",
  ],
  [
    "Memory architectures for LLM assistants",
    5,
    ["memory", "llm", "retrieval", "assistants", "remember"],
    "Working memory, episodic memory and a durable store.",
  ],
  [
    "Local-first software: you own your data",
    7,
    ["local-first", "privacy", "sync", "ownership"],
    "Apps that work offline and keep data on your machine.",
  ],
  [
    "Vector search explained with pictures",
    2,
    ["vector", "embeddings", "search", "similarity", "cosine"],
    "Embeddings, nearest neighbours and why cosine works.",
  ],
  [
    "WebAssembly for heavy work in the browser",
    6,
    ["wasm", "webassembly", "browser", "performance"],
    "Running compiled code next to JavaScript at near-native speed.",
  ],
  [
    "Manifest V3 service workers in practice",
    3,
    ["chrome", "extension", "mv3", "service-worker"],
    "Short-lived workers, alarms and what moved to offscreen documents.",
  ],
  [
    "Tool use and the Model Context Protocol",
    4,
    ["mcp", "tools", "agents", "protocol"],
    "Giving models typed tools through one protocol.",
  ],
  [
    "Retrieval-augmented generation, honestly",
    5,
    ["rag", "retrieval", "llm", "search", "context"],
    "When RAG helps, when it hides a bad index.",
  ],
  [
    "Privacy budgets for personal software",
    7,
    ["privacy", "local-first", "data", "trust"],
    "Deciding what may leave the device and why.",
  ],
  [
    "Readability: extracting the article from the page",
    6,
    ["readability", "extraction", "browser", "articles"],
    "How reader modes find the main text.",
  ],
  [
    "Debounce, throttle and perceived speed",
    6,
    ["performance", "ui", "latency", "search"],
    "Making search feel instant without hammering the index.",
  ],
  [
    "Knowledge graphs from your reading",
    2,
    ["graph", "knowledge", "connections", "notes"],
    "Linking ideas across everything you read.",
  ],
  [
    "Force-directed layouts without the jank",
    0,
    ["graph", "d3-force", "canvas", "visualisation"],
    "Settling thousands of nodes on Canvas 2D.",
  ],
  [
    "Skills for coding agents",
    4,
    ["agents", "skills", "tools", "coding"],
    "Packaging know-how so an agent can load it on demand.",
  ],
  [
    "Prompt injection is still unsolved",
    4,
    ["security", "agents", "llm", "privacy"],
    "Untrusted text and tools do not mix.",
  ],
  [
    "Semantic search for personal notes",
    2,
    ["search", "embeddings", "notes", "memory"],
    "Find the note by what it meant, not what it said.",
  ],
  [
    "Offscreen documents in Chrome extensions",
    3,
    ["chrome", "extension", "offscreen", "wasm"],
    "A long-lived DOM for work a service worker can't host.",
  ],
  [
    "Hybrid ranking: lexical meets vector",
    1,
    ["search", "ranking", "vector", "lexical", "fallback"],
    "Blend BM25 with embeddings and keep a fallback.",
  ],
  [
    "Spaced repetition and forgetting curves",
    2,
    ["memory", "learning", "remember", "notes"],
    "Why you forget and when to review.",
  ],
  [
    "Designing command palettes",
    6,
    ["ui", "palette", "keyboard", "search"],
    "Fuzzy matching, recency and keyboard-first flows.",
  ],
  [
    "Shadow DOM for injected UI",
    6,
    ["shadow-dom", "extension", "ui", "isolation"],
    "Keeping a content script's styles out of the host page.",
  ],
  [
    "Small embedding models are good enough",
    1,
    ["embeddings", "minilm", "models", "vector"],
    "MiniLM-class models for on-device retrieval.",
  ],
  [
    "Agents need memory, not bigger context",
    5,
    ["agents", "memory", "context", "long-term"],
    "Recall beats stuffing a million tokens.",
  ],
  [
    "Offline-first sync with CRDTs",
    7,
    ["sync", "local-first", "offline", "data"],
    "Merging edits without a server in the middle.",
  ],
  [
    "Measuring latency the right way",
    6,
    ["latency", "performance", "measurement"],
    "Percentiles, warm versus cold, and lying averages.",
  ],
  [
    "How browsers schedule work",
    6,
    ["browser", "performance", "event-loop"],
    "Tasks, microtasks and rendering.",
  ],
  [
    "Summaries that don't hallucinate",
    4,
    ["summaries", "llm", "evaluation"],
    "Short, grounded, cheap summaries of long pages.",
  ],
  [
    "Evaluating retrieval quality",
    1,
    ["evaluation", "retrieval", "search", "ranking"],
    "Recall at k, MRR and building a test set.",
  ],
  [
    "The case for personal search engines",
    2,
    ["search", "personal", "memory", "privacy"],
    "Your history is the best index you'll never use.",
  ],
  [
    "Chrome storage limits and unlimitedStorage",
    3,
    ["chrome", "storage", "extension", "data"],
    "What fits in storage.local and when to ask for more.",
  ],
  [
    "Building with the browser's IndexedDB",
    6,
    ["storage", "browser", "data", "offline"],
    "Transactions, versions and quotas.",
  ],
  [
    "Graph search and node inspectors",
    0,
    ["graph", "ui", "search", "visualisation"],
    "Highlight, focus and explain a node.",
  ],
  [
    "What an agent harness actually does",
    4,
    ["agents", "tools", "harness", "skills"],
    "Loops, tools, memory and guardrails.",
  ],
  [
    "Cosine similarity, intuitively",
    2,
    ["cosine", "similarity", "vector", "embeddings"],
    "Angles, not distances.",
  ],
  [
    "Keyboard-first interfaces",
    6,
    ["keyboard", "ui", "accessibility", "palette"],
    "Every action one shortcut away.",
  ],
  [
    "Bioluminescent fungi and the wood wide web",
    2,
    ["mycelium", "network", "nature", "connections"],
    "How fungal networks connect a forest.",
  ],
  [
    "Rate limits, queues and backoff",
    3,
    ["queues", "api", "retry", "reliability"],
    "Queue the slow call so ingestion never waits.",
  ],
  [
    "Designing honest privacy copy",
    7,
    ["privacy", "trust", "copy", "data"],
    "Say what syncs, what stays and what is optional.",
  ],
  [
    "Caching derived data by revision",
    0,
    ["cache", "performance", "graph", "data"],
    "Recompute only when the data revision changes.",
  ],
];

export const PAGES: Page[] = raw.map(([title, d, tags, excerpt], i) => ({
  id: i,
  title,
  domain: DOMAINS[d],
  words: 620 + ((i * 397) % 2900),
  revisits: 1 + ((i * 7) % 6),
  matches: (i * 5) % 9,
  tags,
  excerpt,
}));

export const domainColor = (domain: string) =>
  DOMAIN_COLORS[DOMAINS.indexOf(domain) % DOMAIN_COLORS.length];
