/**
 * The terminal's vocabulary (pure data): the command list, examples for
 * help <command>, and which commands a shared ?run= link may replay. Used by
 * /terminal and listed on /functions.
 */

export type TerminalCommand = { name: string; args?: string; help: string };

export const COMMANDS: TerminalCommand[] = [
  { name: "help", help: "this list" },
  { name: "whoami", help: "who Ayan is, in one breath" },
  {
    name: "ls",
    args: "[projects [role]|exp|skills]",
    help: "list things (ls projects ai)",
  },
  { name: "cat", args: "<project>", help: "read a project (try: cat youbank)" },
  { name: "open", args: "<project|resume|github|linkedin|x>", help: "open it" },
  { name: "exp", help: "where he has worked" },
  { name: "skills", help: "the toolbox" },
  { name: "awards", help: "leadership and recognition" },
  { name: "stats", help: "public GitHub numbers" },
  { name: "contact", help: "how to reach him" },
  { name: "ask", args: "<question>", help: "ask ayan-bot anything about Ayan" },
  {
    name: "fit",
    args: "<job description>",
    help: "paste a role, see what his work backs up",
  },
  {
    name: "go",
    args: "<about|projects|contact|…>",
    help: "jump to a home section",
  },
  { name: "grep", args: "<word>", help: "search all the work (grep pytorch)" },
  { name: "diff", args: "<project> <project>", help: "compare two builds" },
  {
    name: "cv",
    args: "[ai|fintech|systems|fullstack|research]",
    help: "the CV, tailored",
  },
  { name: "tour", help: "the 40-second guided tour" },
  { name: "top", help: "most-used tech across every build" },
  { name: "neofetch", help: "the system, at a glance" },
  { name: "share", help: "copy a link that replays your last command" },
  { name: "history", args: "[-c]", help: "commands you've run (-c clears)" },
  { name: "clear", help: "clear the screen (Ctrl+L)" },
  { name: "exit", help: "back to the site" },
];

/** Examples for help <command>. */
export const EXAMPLES: Record<string, string[]> = {
  ls: ["ls projects", "ls projects fintech", "ls exp"],
  cat: ["cat youbank", "cat jrv", "cat walk-free"],
  open: ["open resume", "open github", "open runway"],
  grep: ["grep pytorch", "grep rust", "grep monte carlo"],
  diff: ["diff youbank runway", "diff mycelium mossjarvis"],
  fit: ["fit Python, React, LLM agents, Kubernetes", "fit ask"],
  cv: ["cv", "cv fintech", "cv ai"],
  ask: ["ask what did he build at Moss", "ask why Rust for QuantDesk"],
  go: ["go projects", "go contact"],
  history: ["history", "history -c"],
  share: ["grep rust", "share"],
};

/**
 * Commands a shared link (?run=) may replay: read-only ones. Never ask
 * (credits), fit ask, open/cv/tour/exit (navigation) or history -c.
 */
const LINK_SAFE = new Set([
  "man",
  "help",
  "whoami",
  "ls",
  "cat",
  "less",
  "more",
  "exp",
  "experience",
  "skills",
  "awards",
  "stats",
  "contact",
  "grep",
  "search",
  "find",
  "diff",
  "compare",
  "neofetch",
  "interests",
  "fit",
  "history",
  "top",
  "htop",
]);
export function linkSafe(cmd: string): boolean {
  const [head, ...rest] = cmd.trim().split(/\s+/);
  const h = head.toLowerCase();
  if (!LINK_SAFE.has(h)) return false;
  if (h === "fit" && /^ask\b/i.test(rest.join(" "))) return false;
  if (h === "history" && rest.length) return false;
  return true;
}
