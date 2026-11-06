/**
 * The Fit check's vocabulary: pure data and patterns (no content imports),
 * so lib/fit can build the evidence index on the server and the unit tests
 * can run against the real patterns.
 */

/**
 * `cs` makes both patterns case-sensitive (acronyms like SEC that are also
 * ordinary words). Patterns need technical context on purpose: a sales job
 * ad that says "the rest of the team" or "take ownership" must not score.
 */
export type Term = {
  id: string;
  label: string;
  jd: string;
  ev?: string;
  cs?: true;
};

export const TERMS: Term[] = [
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
    ev: "\\bsql|postgres|sqlite|duckdb|\\bneon\\b",
  },
  // Web and apps
  { id: "react", label: "React", jd: "\\breact\\b" },
  { id: "nextjs", label: "Next.js", jd: "next\\.?js" },
  { id: "node", label: "Node.js", jd: "\\bnode\\.?js\\b" },
  {
    id: "fastapi",
    label: "FastAPI / Python APIs",
    jd: "fastapi|\\bflask\\b|\\bdjango\\b",
    ev: "fastapi|\\bexpress\\b|rest api",
  },
  {
    id: "api",
    label: "APIs / backend",
    jd: "\\bapis?\\b|\\bbackend\\b|back-end|\\brest(ful)? apis?\\b|\\brestful\\b|microservices?",
    ev: "\\bexpress\\b|fastapi|\\bserver\\b|backend|rest api",
  },
  {
    id: "frontend",
    label: "Frontend / UI",
    jd: "front-?end|\\bui\\b|user interfaces?|\\bcss\\b|tailwind",
    ev: "\\breact\\b|next\\.js|tailwind|\\bui\\b",
  },
  {
    id: "fullstack",
    label: "Full-stack",
    jd: "full[- ]?stack",
    ev: "next\\.js|\\breact\\b|postgres|supabase|\\bexpress\\b",
  },
  {
    id: "desktop",
    label: "Desktop apps",
    jd: "desktop (apps?|applications?|software)|\\belectron\\b|\\btauri\\b",
    ev: "tauri|desktop|\\boverlay",
  },
  {
    id: "extensions",
    label: "Browser extensions",
    jd: "browser extensions?|chrome extensions?",
    ev: "chrome extension",
  },
  {
    id: "wasm",
    label: "WebAssembly",
    jd: "webassembly|\\bwasm\\b",
    ev: "webassembly|\\bwasm\\b",
  },
  // Data
  {
    id: "postgres",
    label: "PostgreSQL",
    jd: "postgres",
    ev: "postgres|\\bneon\\b|supabase",
  },
  {
    id: "scraping",
    label: "Scraping / data collection",
    jd: "scrap(ing|ers?)\\b|web crawl|\\bcrawlers?\\b",
    ev: "scrap(ing|er|y)|beautifulsoup|selenium|crawl",
  },
  {
    id: "pipelines",
    label: "Data pipelines / ETL",
    jd: "\\betl\\b|\\belt\\b|data pipelines?|data engineering|data ingestion",
    ev: "pipelines?\\b|\\bingest|\\betl\\b|\\bcleaning\\b",
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
    jd: "\\bllms?\\b|large language models?|\\bgpt|\\bopenai\\b|\\banthropic\\b|\\bclaude\\b|generative ai|\\bgen ?ai\\b",
    ev: "\\bllms?\\b|openrouter|ai sdk|\\bgpt|muse spark",
  },
  {
    id: "rag",
    label: "Retrieval / RAG / search",
    jd: "\\brag\\b|retrieval|semantic search|vector (db|database|search|store)s?|\\bembeddings?\\b|search (engine|ranking|relevance|quality|infrastructure)",
    ev: "retrieval|semantic|\\bsearch\\b|rerank|embedding",
  },
  {
    id: "agents",
    label: "AI agents",
    jd: "\\b(ai|llm|autonomous|coding|software) agents?\\b|\\bagentic\\b|tool[- ](use|calling)|multi-agent",
    ev: "\\bagents?\\b|autopilot|agentic",
  },
  {
    id: "nlp",
    label: "NLP",
    jd: "\\bnlp\\b|natural language processing",
    ev: "\\bnlp\\b|natural language|language model|\\bqa\\b",
  },
  {
    id: "cv",
    label: "Computer vision",
    jd: "computer vision|opencv|image (recognition|classification|processing|segmentation)|object detection",
    ev: "opencv|computer vision|\\bfaces?\\b|\\bscenes?\\b",
  },
  {
    id: "evals",
    label: "Evals / benchmarks",
    jd: "\\bevals?\\b|(model|llm|ai) evaluations?|benchmark(s|ing)?\\b",
    ev: "\\bevals?\\b|\\bevaluat|benchmark|recall@|ablation",
  },
  {
    id: "gnn",
    label: "Graph ML",
    jd: "graph neural|\\bgnns?\\b|graph ml|graph machine learning",
    ev: "graphsage|pytorch geometric|graph neural|\\bgnn",
  },
  // Finance
  {
    id: "fintech",
    label: "Fintech",
    jd: "fintech|financial (services|technology)|\\bbanking\\b|\\bpayments\\b",
    ev: "fintech|\\bfinancial\\b|edgar|deal desk|\\bcash\\b|portfolio",
  },
  {
    id: "quant",
    label: "Quant / risk models",
    jd: "\\bquant(itative)?\\b|risk model|\\bvar\\b|volatility|garch|monte carlo|derivatives|options pricing",
    ev: "garch|\\bvar\\b|monte carlo|volatility|\\bquant|\\brisk\\b",
  },
  {
    id: "valuation",
    label: "Valuation / DCF",
    jd: "\\bvaluation|\\bdcf\\b|financial model(ing|s)?\\b|investment banking|private equity|\\bm&a\\b",
    ev: "\\bdcf\\b|\\bvaluation|\\blbo\\b|\\bwacc\\b|\\bcomps\\b|m&a",
  },
  {
    id: "sec",
    label: "SEC / EDGAR / XBRL",
    // Case-sensitive: "SEC" the regulator, not "ops/sec" or "second".
    jd: "\\bSEC\\b|EDGAR|XBRL|10-K|\\b[Ff]ilings\\b",
    ev: "\\bSEC\\b|EDGAR|XBRL|10-K",
    cs: true,
  },
  {
    id: "trading",
    label: "Trading systems",
    jd: "trading (systems?|platforms?|infrastructure|strateg(y|ies))|algorithmic trading|order books?|matching engines?|market data|low[- ]latency",
    ev: "matching engine|trading|market data|ops/sec",
  },
  // Engineering practice
  {
    id: "testing",
    label: "Testing",
    jd: "unit tests?|automated tests?|\\btdd\\b|test coverage|integration tests?|software testing",
    ev: "unit tests|\\btests\\b|hypothesis|property test",
  },
  {
    id: "perf",
    label: "Performance",
    jd: "\\blatency\\b|performance (engineering|optimi[sz]ation|tuning|critical)|\\bprofiling\\b",
    ev: "sub-10ms|latency|ops/sec|p99",
  },
  {
    id: "cloud",
    label: "Cloud / deploys",
    jd: "\\bcloud\\b|\\bvercel\\b|serverless|deployments?\\b|\\bci/cd\\b",
    ev: "vercel|\\bmodal\\b|cloudflare|deploy",
  },
  {
    id: "opensource",
    label: "Open source",
    jd: "open[- ]source",
    ev: "open-source|open source|pull requests|\\bstars\\b",
  },
  {
    id: "startup",
    label: "Startup experience",
    jd: "\\bstartups?\\b|early[- ]stage|founding (engineer|team)|0 to 1|zero to one",
    // YC and early-team evidence, not products made *for* startups.
    ev: "\\byc\\b|y combinator|first interns?|one of the first",
  },
  {
    id: "leadership",
    label: "Leadership",
    jd: "\\bleadership\\b|lead(ing)? (a )?team|\\bmentor(ing|ship)?\\b",
    // "founded"/"founder", not "the founders" a product is built for.
    ev: "\\bfounded\\b|\\bfounder\\b|\\bpresident\\b|\\bcaptain\\b",
  },
];

/**
 * Common technologies this site has no evidence for (shown honestly). Each
 * matches case-sensitively, as the proper noun: "swift follow-up", "guard
 * rails" and "jobs@acme.net" are not gaps. Go only counts in a tech list or
 * next to a tech word, not in "Go above and beyond".
 */
export const NOT_ON_SITE: (string | { label: string; re: string })[] = [
  "Kubernetes",
  "Docker",
  "AWS",
  "GCP",
  "Azure",
  "Terraform",
  {
    label: "Go",
    re: "(?<![\\w.])Go(?=\\s*[,/;)]|\\s+(and|or|services?|developers?|engineers?|experience|microservices|backends?)\\b)|(?<=[,/(]\\s*)Go\\b|\\bGolang\\b",
  },
  "Kotlin",
  {
    label: "Swift",
    re: "(?<![\\w.])Swift(?=\\s*[,/;)]|\\s*$|\\s+(and|or|UI|developers?|engineers?|experience)\\b)|(?<=[,/(]\\s*)Swift\\b|\\bSwiftUI\\b",
  },
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
  { label: ".NET", re: "(?<![\\w@-])(ASP)?\\.NET\\b" },
  "Ruby",
  { label: "Rails", re: "Ruby on Rails|(?<![\\w])Rails\\b(?! of)" },
  "PHP",
  "Angular",
  "Vue",
  "Flutter",
  "Salesforce",
  "Hadoop",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The default gap pattern: the exact name, case-sensitive, not inside a
 * longer word. Names that start with a symbol need no left boundary.
 */
export function gapPattern(m: string): string {
  return `${/^\w/.test(m) ? "(?<![\\w.])" : ""}${escape(m)}(?![\\w${m.length <= 3 ? "-" : ""}])`;
}
