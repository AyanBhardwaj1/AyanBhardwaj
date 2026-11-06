import { experience, projects, skills } from "@/content/content";
import { projectHref } from "./projects";

/**
 * Fit check: match a pasted job description against what this site can back
 * up. Each term has a pattern for spotting it in a job description (`jd`) and
 * one for finding evidence in the site's own content (`ev`). Evidence is
 * computed here on the server from content.ts, so the client only receives a
 * small index and never needs a model.
 */

type Term = { id: string; label: string; jd: string; ev?: string };

const TERMS: Term[] = [
  // Languages
  { id: "python", label: "Python", jd: "\\bpython\\b" },
  { id: "typescript", label: "TypeScript", jd: "\\btypescript\\b|\\bts\\b" },
  {
    id: "javascript",
    label: "JavaScript",
    // "js" alone, not the tail of Next.js / Node.js.
    jd: "\\bjavascript\\b|(?<![.\\w])js\\b|\\becmascript\\b",
    ev: "\\b(javascript|typescript|react|next\\.js|node)\\b",
  },
  { id: "rust", label: "Rust", jd: "\\brust\\b" },
  { id: "cpp", label: "C++", jd: "c\\+\\+|\\bcpp\\b", ev: "c\\+\\+|arduino" },
  { id: "java", label: "Java", jd: "\\bjava\\b(?!script)" },
  {
    id: "sql",
    label: "SQL",
    jd: "\\bsql\\b|\\bpostgres|\\bsqlite\\b|relational database",
    ev: "\\bsql|postgres|sqlite|duckdb|neon",
  },
  // Web and apps
  { id: "react", label: "React", jd: "\\breact\\b" },
  { id: "nextjs", label: "Next.js", jd: "next\\.?js" },
  { id: "node", label: "Node.js", jd: "node\\.?js|\\bnode\\b" },
  {
    id: "fastapi",
    label: "FastAPI / Python APIs",
    jd: "fastapi|flask|django",
    ev: "fastapi|express|rest api",
  },
  {
    id: "api",
    label: "APIs / backend",
    jd: "\\bapis?\\b|\\bbackend\\b|back-end|\\brest(ful)?\\b|microservices?",
    ev: "\\bapi|express|fastapi|server|postgres|backend",
  },
  {
    id: "frontend",
    label: "Frontend / UI",
    jd: "front-?end|\\bui\\b|user interface|css|tailwind",
    ev: "react|next\\.js|tailwind|\\bui\\b",
  },
  {
    id: "fullstack",
    label: "Full-stack",
    jd: "full[- ]?stack",
    ev: "next\\.js|react|postgres|supabase|express",
  },
  {
    id: "desktop",
    label: "Desktop apps",
    jd: "desktop|electron|tauri",
    ev: "tauri|desktop|\\boverlay",
  },
  {
    id: "extensions",
    label: "Browser extensions",
    jd: "browser extension|chrome extension",
    ev: "chrome extension",
  },
  {
    id: "wasm",
    label: "WebAssembly",
    jd: "webassembly|\\bwasm\\b",
    ev: "webassembly|wasm|moss",
  },
  // Data
  {
    id: "postgres",
    label: "PostgreSQL",
    jd: "postgres",
    ev: "postgres|neon|supabase",
  },
  {
    id: "scraping",
    label: "Scraping / data collection",
    jd: "scrap(ing|er)|crawl|data collection",
    ev: "scrap|beautifulsoup|selenium|crawl",
  },
  {
    id: "pipelines",
    label: "Data pipelines / ETL",
    jd: "\\betl\\b|data pipelines?|data engineering|ingest",
    ev: "pipeline|ingest|etl|cleaning",
  },
  // AI / ML
  {
    id: "ml",
    label: "Machine learning",
    jd: "machine learning|\\bml\\b",
    ev: "pytorch|scikit|classifier|neural|graphsage|machine learning|\\bml\\b",
  },
  {
    id: "dl",
    label: "Deep learning / PyTorch",
    jd: "deep learning|pytorch|neural net",
    ev: "pytorch|neural|graphsage",
  },
  {
    id: "llm",
    label: "LLMs",
    jd: "\\bllms?\\b|large language model|gpt|openai|anthropic|generative ai|gen ?ai",
    ev: "llm|openrouter|ai sdk|agent|gpt|muse spark",
  },
  {
    id: "rag",
    label: "Retrieval / RAG / search",
    jd: "\\brag\\b|retrieval|semantic search|vector|embedding|\\bsearch",
    ev: "retrieval|semantic|search|rerank|moss|embedding",
  },
  {
    id: "agents",
    label: "AI agents",
    jd: "\\bagents?\\b|agentic|tool use|autonomous",
    ev: "\\bagents?\\b|autopilot|agentic",
  },
  {
    id: "nlp",
    label: "NLP",
    jd: "\\bnlp\\b|natural language",
    ev: "\\bnlp\\b|natural language|language model|\\bqa\\b",
  },
  {
    id: "cv",
    label: "Computer vision",
    jd: "computer vision|opencv|\\bimages?\\b",
    ev: "opencv|vision|\\bfaces?\\b|\\bscenes?\\b",
  },
  {
    id: "evals",
    label: "Evals / benchmarks",
    jd: "\\bevals?\\b|evaluation|benchmark",
    ev: "eval|benchmark|recall@|ablation",
  },
  {
    id: "gnn",
    label: "Graph ML",
    jd: "graph neural|\\bgnn\\b|graph ml",
    ev: "graphsage|pytorch geometric|graph neural|\\bgnn",
  },
  // Finance
  {
    id: "fintech",
    label: "Fintech",
    jd: "fintech|financial (services|technology)|banking|payments",
    ev: "finance|fintech|\\bsec\\b|edgar|deal desk|cash",
  },
  {
    id: "quant",
    label: "Quant / risk models",
    jd: "\\bquant|risk model|\\bvar\\b|volatility|garch|monte carlo|derivatives",
    ev: "garch|\\bvar\\b|monte carlo|volatility|\\bquant|\\brisk\\b",
  },
  {
    id: "valuation",
    label: "Valuation / DCF",
    jd: "\\bvaluation|\\bdcf\\b|financial model|investment banking|private equity|m&a",
    ev: "\\bdcf\\b|\\bvaluation|\\blbo\\b|\\bwacc\\b|\\bcomps\\b|m&a",
  },
  {
    id: "sec",
    label: "SEC / EDGAR / XBRL",
    jd: "\\bsec\\b|edgar|xbrl|10-k|filings",
    ev: "\\bsec\\b|edgar|xbrl|10-k",
  },
  {
    id: "trading",
    label: "Trading systems",
    jd: "trading|order book|matching engine|market data|low latency",
    ev: "matching engine|trading|market data|ops/sec",
  },
  // Engineering practice
  {
    id: "testing",
    label: "Testing",
    jd: "testing|unit tests?|\\btdd\\b|test coverage|\\bqa\\b",
    ev: "unit tests|tests|hypothesis|property test",
  },
  {
    id: "perf",
    label: "Performance",
    jd: "performance|latency|optimi[sz]",
    ev: "sub-10ms|latency|ops/sec|p99",
  },
  {
    id: "cloud",
    label: "Cloud / deploys",
    jd: "\\bcloud\\b|vercel|serverless|deploy",
    ev: "vercel|modal|cloudflare|deploy",
  },
  {
    id: "opensource",
    label: "Open source",
    jd: "open[- ]source",
    ev: "open-source|open source|pull requests|stars",
  },
  {
    id: "startup",
    label: "Startup experience",
    jd: "startup|early[- ]stage|founding|0 to 1|zero to one|fast-paced",
    ev: "yc|startup|founded|founder|first interns",
  },
  {
    id: "leadership",
    label: "Leadership",
    jd: "leadership|lead(ing)? (a )?team|mentor|ownership",
    ev: "founded|founder|\\bled\\b|\\bmembers\\b|adopted by",
  },
  {
    id: "product",
    label: "Product sense",
    jd: "product sense|product-minded|user empathy|customer",
    ev: "users|advisors|founders|students|waitlist",
  },
];

/** Common technologies this site has no evidence for (shown honestly). */
const NOT_ON_SITE = [
  "Kubernetes",
  "Docker",
  "AWS",
  "GCP",
  "Azure",
  "Terraform",
  "Go",
  "Golang",
  "Kotlin",
  "Swift",
  "iOS",
  "Android",
  "Scala",
  "Apache Spark",
  "Kafka",
  "Airflow",
  "dbt",
  "Snowflake",
  "Redis",
  "MongoDB",
  "GraphQL",
  "C#",
  ".NET",
  "Ruby",
  "Rails",
  "PHP",
  "Angular",
  "Vue",
  "Flutter",
  "Salesforce",
  "Hadoop",
];

export type FitTerm = {
  id: string;
  label: string;
  jd: string;
  evidence: { name: string; href: string | null }[];
};
export type FitIndex = { terms: FitTerm[]; notOnSite: string[] };

const haystacks = [
  ...projects.map((p) => ({
    name: p.name,
    href: projectHref(p.id),
    text: [
      p.tagline,
      p.description,
      ...(p.howItWorks ?? []),
      ...p.stack,
      ...(p.metrics ?? []),
      p.category,
      p.context ?? "",
      p.builtAt ?? "",
    ].join(" "),
    weight:
      p.tier === "featured"
        ? 3
        : p.tier === "moss" || p.tier === "hackathon"
          ? 2
          : 1,
  })),
  ...experience.map((e) => ({
    name: e.company,
    href: "/#experience",
    text: [
      e.role,
      e.summary,
      e.companyBlurb ?? "",
      e.companyNote ?? "",
      ...e.bullets,
      ...e.tags,
    ].join(" "),
    weight: 3,
  })),
  // Listed skills count last: a claim, not a project, and named as such.
  ...skills.map((g) => ({
    name: `Skills (${g.label})`,
    href: null,
    text: g.items.join(", "),
    weight: 0,
  })),
];

/**
 * Built on the server: every term with up to 4 pieces of evidence. Terms
 * with none stay in, so a role that asks for them shows an honest gap.
 */
export function fitIndex(): FitIndex {
  const terms = TERMS.map((t) => {
    const re = new RegExp(t.ev ?? t.jd, "i");
    const evidence = haystacks
      .filter((h) => re.test(h.text))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 4)
      .map((h) => ({ name: h.name, href: h.href }));
    return { id: t.id, label: t.label, jd: t.jd, evidence };
  });
  return { terms, notOnSite: NOT_ON_SITE };
}
