import type { Project } from "@/content/content";

/**
 * Role lenses for the "What are you hiring for?" filter. Each project gets
 * tags derived from its own category, stack and description (no hand-kept
 * lists to drift out of date).
 */
export const ROLES = [
  { id: "ai", label: "AI / ML" },
  { id: "fintech", label: "Fintech" },
  { id: "systems", label: "Systems" },
  { id: "fullstack", label: "Full-stack" },
  { id: "research", label: "Research" },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];

const has = (hay: string, re: RegExp) => re.test(hay);

export function roleTags(p: Project): RoleId[] {
  const stack = p.stack.join(" ");
  const text = `${p.tagline} ${p.description} ${p.context ?? ""}`;
  const tags = new Set<RoleId>();
  if (
    p.category === "AI" ||
    p.category === "Search" ||
    has(
      stack,
      /PyTorch|OpenRouter|Moss|OpenCV|scikit|Vercel AI SDK|Hermes|Muse Spark|LLM|Streamlit/i,
    ) ||
    has(
      text,
      /\b(LLM|agents?|neural|model|semantic|retrieval|classifier|evals?)\b/i,
    )
  )
    tags.add("ai");
  if (
    p.category === "Finance" ||
    has(
      text,
      /\b(SEC|EDGAR|market|quant|trading|portfolio|cash|burn|deal desk|volatility)\b/i,
    )
  )
    tags.add("fintech");
  if (
    has(
      stack,
      /Rust|WebAssembly|WASM|Tauri|DuckDB|SQLite|Arduino|C\+\+|Node\.js/i,
    ) ||
    has(text, /\b(matching engine|MCP|on-device|ops\/sec|latency)\b/i)
  )
    tags.add("systems");
  if (
    has(
      stack,
      /Next\.js|React|Postgres|Supabase|Tailwind|Express|Vite|MapLibre/i,
    )
  )
    tags.add("fullstack");
  if (
    p.category === "Research" ||
    p.category === "Health" ||
    has(text, /\b(research|Lincoln Laboratory|lab|benchmark|evals?|sensor)\b/i)
  )
    tags.add("research");
  return [...tags];
}

/** Space-separated, for data-roles="ai fintech" (matches with ~=). */
export const roleAttr = (p: Project) => roleTags(p).join(" ");
