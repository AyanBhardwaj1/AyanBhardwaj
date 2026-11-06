"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import "./terminal.css";

/**
 * AYAN terminal: a command line over the site's own content. Commands print
 * structured lines (no HTML from data), links are real <a>/<Link>, history
 * and tab completion work like a shell, and `ask` hands a question to
 * ayan-bot. Output is a log region; the input is a labelled text field, so
 * it works with screen readers and on-screen keyboards.
 */

export type TerminalData = {
  name: string;
  role: string;
  location: string;
  headline: string;
  about: string;
  school: string;
  projects: {
    id: string;
    code: string | null;
    name: string;
    tagline: string;
    description: string;
    stack: string[];
    metrics: string[];
    where: string;
    live: string | null;
    code_url: string | null;
    page: string | null;
    stars: number | null;
  }[];
  experience: {
    company: string;
    note: string | null;
    role: string;
    when: string;
    summary: string;
    bullets: string[];
  }[];
  skills: { label: string; items: string[] }[];
  awards: { title: string; org: string }[];
  interests: { label: string; line: string }[];
  links: {
    email: string;
    emailHref: string;
    github: string;
    linkedin: string;
    x: string | null;
    resume: string | null;
  };
  stats: {
    repos: number;
    stars: number;
    contributions12m: number;
    languages: string[];
  };
};

type Seg =
  | string
  | { t: string; tone?: "accent" | "muted" | "up" | "down" | "strong" }
  | { t: string; href: string; ext?: boolean };
type Line = {
  id: number;
  segs: Seg[];
  kind?: "cmd" | "out" | "err" | "banner";
};

const BANNER = [
  " █████╗ ██╗   ██╗ █████╗ ███╗   ██╗",
  "██╔══██╗╚██╗ ██╔╝██╔══██╗████╗  ██║",
  "███████║ ╚████╔╝ ███████║██╔██╗ ██║",
  "██╔══██║  ╚██╔╝  ██╔══██║██║╚██╗██║",
  "██║  ██║   ██║   ██║  ██║██║ ╚████║",
  "╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝",
];

const COMMANDS: { name: string; args?: string; help: string }[] = [
  { name: "help", help: "this list" },
  { name: "whoami", help: "who Ayan is, in one breath" },
  { name: "ls", args: "[projects|exp|skills]", help: "list things" },
  { name: "cat", args: "<project>", help: "read a project (try: cat youbank)" },
  { name: "open", args: "<project|resume|github|linkedin|x>", help: "open it" },
  { name: "exp", help: "where he has worked" },
  { name: "skills", help: "the toolbox" },
  { name: "awards", help: "leadership and recognition" },
  { name: "stats", help: "public GitHub numbers" },
  { name: "contact", help: "how to reach him" },
  { name: "ask", args: "<question>", help: "ask ayan-bot anything about Ayan" },
  {
    name: "go",
    args: "<about|projects|contact|…>",
    help: "jump to a home section",
  },
  { name: "history", help: "commands you've run" },
  { name: "clear", help: "clear the screen (Ctrl+L)" },
  { name: "exit", help: "back to the site" },
];

const SECTIONS = [
  "about",
  "experience",
  "projects",
  "trophies",
  "activity",
  "contact",
];

const s = (
  t: string,
  tone?: "accent" | "muted" | "up" | "down" | "strong",
): Seg => ({ t, tone });
const a = (t: string, href: string, ext = false): Seg => ({ t, href, ext });

export function Terminal({ data }: { data: TerminalData }) {
  const router = useRouter();
  const inputId = useId();
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState<number | null>(null);
  const [hint, setHint] = useState("");
  const idRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const print = useCallback((segs: Seg[], kind: Line["kind"] = "out") => {
    setLines((l) => [...l.slice(-400), { id: idRef.current++, segs, kind }]);
  }, []);

  const findProject = useCallback(
    (q: string, fuzzy = true) => {
      const k = q.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!k) return undefined;
      return (
        data.projects.find(
          (p) =>
            p.id.replace(/-/g, "") === k ||
            p.name.toLowerCase().replace(/[^a-z0-9]/g, "") === k ||
            (p.code ?? "").toLowerCase() === k,
        ) ??
        data.projects.find(
          (p) =>
            p.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .startsWith(k) || (p.code ?? "").toLowerCase().startsWith(k),
        ) ??
        // Last resort: letters in order ("yb" -> YouBank, "jrv" -> mossJARVIS).
        (fuzzy && k.length >= 2
          ? data.projects.find((p) => {
              let i = 0;
              for (const ch of p.name.toLowerCase()) if (ch === k[i]) i++;
              return i === k.length;
            })
          : undefined)
      );
    },
    [data.projects],
  );

  // Boot: banner and a short MOTD.
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const boot: [Seg[], Line["kind"]][] = [
      ...BANNER.map((b): [Seg[], Line["kind"]] => [[s(b, "accent")], "banner"]),
      [[s(`${data.name} · ${data.role} · ${data.location}`, "strong")], "out"],
      [[s(data.headline, "muted")], "out"],
      [[""], "out"],
      [
        [
          "Type ",
          s("help", "accent"),
          " to see commands, ",
          s("ls projects", "accent"),
          " to start, or ",
          s("ask", "accent"),
          " to talk to ayan-bot. Tab completes, ↑/↓ walks history.",
        ],
        "out",
      ],
    ];
    if (reduce) {
      const t = window.setTimeout(
        () => boot.forEach(([segs, kind]) => print(segs, kind)),
        0,
      );
      return () => {
        window.clearTimeout(t);
        setLines([]);
      };
    }
    const timers = boot.map(([segs, kind], i) =>
      window.setTimeout(() => print(segs, kind), 60 * i),
    );
    return () => {
      timers.forEach(clearTimeout);
      setLines([]);
    };
  }, [data, print]);

  // Keep the newest output in view.
  useLayoutEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const projectCard = useCallback(
    (p: TerminalData["projects"][number]) => {
      print([
        s(`${p.name}`, "strong"),
        s(`  ${p.code ? `${p.code} <GO>  ` : ""}${p.where}`, "muted"),
      ]);
      print([s(p.tagline, "accent")]);
      print([p.description]);
      if (p.metrics.length)
        print([s("metrics  ", "muted"), p.metrics.join("  ·  ")]);
      print([s("stack    ", "muted"), p.stack.join("  ·  ")]);
      const ls: Seg[] = [s("links    ", "muted")];
      if (p.page) ls.push(a("case study", p.page), "  ");
      if (p.live) ls.push(a("live ↗", p.live, true), "  ");
      if (p.code_url) ls.push(a("code ↗", p.code_url, true), "  ");
      if (p.stars) ls.push(s(`★ ${p.stars}`, "muted"));
      print(ls);
    },
    [print],
  );

  const run = useCallback(
    (raw: string) => {
      const line = raw.trim();
      print([s("ayan@after-hours", "accent"), s(":~$ ", "muted"), line], "cmd");
      if (!line) return;
      setHist((h) => (h.at(-1) === line ? h : [...h.slice(-49), line]));
      const [cmdRaw, ...rest] = line.split(/\s+/);
      let cmd = cmdRaw.toLowerCase();
      const arg = rest.join(" ");
      // `ls exp` / `ls skills` are aliases for their own commands.
      if (cmd === "ls" && /^exp/i.test(arg)) cmd = "exp";
      if (cmd === "ls" && /^skill/i.test(arg)) cmd = "skills";

      switch (cmd) {
        case "help":
        case "?":
        case "man":
          COMMANDS.forEach((c) =>
            print([
              s(`${c.name}${c.args ? ` ${c.args}` : ""}`.padEnd(42), "accent"),
              s(c.help, "muted"),
            ]),
          );
          return;
        case "whoami":
          print([
            s(data.name, "strong"),
            s(`  ${data.role}, ${data.location}`, "muted"),
          ]);
          print([data.about]);
          print([s(data.school, "muted")]);
          return;
        case "ls": {
          const what = (arg || "projects").toLowerCase();
          if (!what.startsWith("proj")) {
            print(
              [s(`ls: ${what}: try projects, exp or skills`, "down")],
              "err",
            );
            return;
          }
          data.projects.forEach((p) =>
            print([
              s((p.code ?? "").padEnd(6), "accent"),
              p.page ? a(p.name, p.page) : s(p.name, "strong"),
              s(`  ${p.tagline}`, "muted"),
            ]),
          );
          print([
            s(
              `${data.projects.length} projects. cat <name> to read one.`,
              "muted",
            ),
          ]);
          return;
        }
        case "cat":
        case "less":
        case "more": {
          const p = findProject(arg);
          if (!p) {
            print(
              [
                s(
                  `cat: ${arg || "(nothing)"}: no such project. ls projects to see them.`,
                  "down",
                ),
              ],
              "err",
            );
            return;
          }
          projectCard(p);
          return;
        }
        case "open": {
          const k = arg.toLowerCase();
          const target =
            k === "resume" || k === "cv"
              ? data.links.resume
              : k === "github" || k === "gh"
                ? data.links.github
                : k === "linkedin" || k === "li"
                  ? data.links.linkedin
                  : k === "x" || k === "twitter"
                    ? data.links.x
                    : k === "email" || k === "mail"
                      ? data.links.emailHref
                      : (() => {
                          const p = findProject(arg);
                          return p?.page ?? p?.live ?? p?.code_url ?? null;
                        })();
          if (!target) {
            print(
              [s(`open: ${arg || "(nothing)"}: nothing to open.`, "down")],
              "err",
            );
            return;
          }
          print([
            s("opening ", "muted"),
            a(target, target, !target.startsWith("/")),
          ]);
          if (target.startsWith("/")) router.push(target);
          else window.open(target, "_blank", "noopener,noreferrer");
          return;
        }
        case "exp":
        case "experience":
          data.experience.forEach((e) => {
            print([
              s(e.company, "strong"),
              s(e.note ? ` (${e.note})` : ""),
              s(`  ${e.role} · ${e.when}`, "muted"),
            ]);
            e.bullets
              .slice(0, 3)
              .forEach((b) =>
                print([s("  › ", "accent"), b.replace(/\*\*/g, "")]),
              );
          });
          return;
        case "skills":
          data.skills.forEach((g) =>
            print([s(g.label.padEnd(22), "accent"), g.items.join(" · ")]),
          );
          return;
        case "awards":
          data.awards.forEach((w) =>
            print([
              s("▲ ", "up"),
              s(w.title, "strong"),
              s(`  ${w.org}`, "muted"),
            ]),
          );
          return;
        case "stats":
          print([s("public repos     ", "muted"), String(data.stats.repos)]);
          print([s("stars (own)      ", "muted"), String(data.stats.stars)]);
          print([
            s("contribs (12m)   ", "muted"),
            String(data.stats.contributions12m),
          ]);
          print([
            s("top languages    ", "muted"),
            data.stats.languages.join(" · "),
          ]);
          return;
        case "contact":
        case "hire":
          print([
            s("email     ", "muted"),
            a(data.links.email, data.links.emailHref),
          ]);
          print([
            s("linkedin  ", "muted"),
            a(data.links.linkedin, data.links.linkedin, true),
          ]);
          print([
            s("github    ", "muted"),
            a(data.links.github, data.links.github, true),
          ]);
          if (data.links.resume)
            print([
              s("resume    ", "muted"),
              a("PDF ↗", data.links.resume, true),
            ]);
          return;
        case "ask":
        case "bot":
          if (!arg) {
            print([
              s(
                "ask: what should ayan-bot answer? e.g. ask what did he build at Moss",
                "muted",
              ),
            ]);
            return;
          }
          print([
            s("handing that to ayan-bot… ", "muted"),
            s("(panel opening)", "accent"),
          ]);
          window.dispatchEvent(
            new CustomEvent("ayan-bot:open", {
              detail: { prompt: arg.slice(0, 480) },
            }),
          );
          return;
        case "go":
        case "cd": {
          const sec = SECTIONS.find((x) =>
            x.startsWith(arg.toLowerCase().replace(/^[/#~.]+/, "")),
          );
          if (!arg || arg === "~" || arg === "/") {
            router.push("/");
            return;
          }
          if (!sec) {
            print([s(`go: ${arg}: try ${SECTIONS.join(", ")}`, "down")], "err");
            return;
          }
          router.push(`/#${sec}`);
          return;
        }
        case "history":
          hist.forEach((h, i) =>
            print([s(String(i + 1).padStart(3) + "  ", "muted"), h]),
          );
          return;
        case "clear":
        case "cls":
          setLines([]);
          return;
        case "exit":
        case "quit":
        case "logout":
          router.push("/");
          return;
        case "sudo":
          print(
            [
              s(
                "ayan is not in the sudoers file. This incident will be reported to recruiting.",
                "down",
              ),
            ],
            "err",
          );
          return;
        case "rm":
          print(
            [
              s(
                "rm: permission denied. Everything here shipped on purpose.",
                "down",
              ),
            ],
            "err",
          );
          return;
        case "vim":
        case "emacs":
        case "nano":
          print([s("No editor wars after hours. Try cat instead.", "muted")]);
          return;
        case "date":
          print([new Date().toString()]);
          return;
        case "echo":
          print([arg]);
          return;
        case "interests":
          data.interests.forEach((i) =>
            print([s(i.label.padEnd(18), "accent"), i.line]),
          );
          return;
        default: {
          // A bare project name works as a shortcut, but only on a close
          // match: a mistyped command should say so, not open a random card.
          const p = findProject(line, false);
          if (p) {
            projectCard(p);
            return;
          }
          print([s(`${cmd}: command not found. Type help.`, "down")], "err");
        }
      }
    },
    [data, findProject, hist, print, projectCard, router],
  );

  const complete = () => {
    const parts = value.split(/\s+/);
    const pool =
      parts.length <= 1
        ? COMMANDS.map((c) => c.name)
        : ["cat", "open", "less", "more"].includes(parts[0].toLowerCase())
          ? [
              ...data.projects.map((p) => p.id),
              ...(parts[0].toLowerCase() === "open"
                ? ["resume", "github", "linkedin", "x", "email"]
                : []),
            ]
          : ["go", "cd"].includes(parts[0].toLowerCase())
            ? SECTIONS
            : parts[0].toLowerCase() === "ls"
              ? ["projects", "exp", "skills"]
              : [];
    const last = (parts.at(-1) ?? "").toLowerCase();
    const hits = pool.filter((x) => x.startsWith(last));
    if (hits.length === 1) {
      parts[parts.length - 1] = hits[0];
      setValue(parts.join(" ") + " ");
      setHint("");
    } else if (hits.length > 1) {
      let pre = hits[0];
      for (const h of hits) while (!h.startsWith(pre)) pre = pre.slice(0, -1);
      if (pre.length > last.length) {
        parts[parts.length - 1] = pre;
        setValue(parts.join(" "));
      }
      setHint(hits.slice(0, 12).join("  "));
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      run(value);
      setValue("");
      setHIdx(null);
      setHint("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp") {
      if (!hist.length) return;
      e.preventDefault();
      const i = hIdx === null ? hist.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(i);
      setValue(hist[i]);
    } else if (e.key === "ArrowDown") {
      if (hIdx === null) return;
      e.preventDefault();
      const i = hIdx + 1;
      if (i >= hist.length) {
        setHIdx(null);
        setValue("");
      } else {
        setHIdx(i);
        setValue(hist[i]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (
      e.key === "c" &&
      e.ctrlKey &&
      !window.getSelection()?.toString()
    ) {
      e.preventDefault();
      print(
        [
          s("ayan@after-hours", "accent"),
          s(":~$ ", "muted"),
          value,
          s("^C", "muted"),
        ],
        "cmd",
      );
      setValue("");
    }
  };

  const quick = [
    "help",
    "whoami",
    "ls projects",
    "cat youbank",
    "stats",
    "contact",
  ];

  return (
    <div
      className="tm-shell"
      data-theme="dark"
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      <div className="tm-bar">
        <span className="tm-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="tm-title">ayan@after-hours: ~</span>
        <Link
          href="/"
          className="tm-close"
          onClick={(e) => e.stopPropagation()}
        >
          <span aria-hidden="true">×</span>
          <span className="sr-only">Close the terminal and go home</span>
        </Link>
      </div>
      <div
        ref={logRef}
        className="tm-log"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Terminal output"
      >
        {lines.map((l) => (
          <p
            key={l.id}
            className={`tm-line tm-${l.kind ?? "out"}`}
            aria-hidden={l.kind === "banner" ? true : undefined}
          >
            {l.segs.map((g, i) =>
              typeof g === "string" ? (
                <span key={i}>{g}</span>
              ) : "href" in g ? (
                g.href.startsWith("/") ? (
                  <Link
                    key={i}
                    href={g.href}
                    className="tm-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {g.t}
                  </Link>
                ) : (
                  <a
                    key={i}
                    href={g.href}
                    className="tm-link"
                    {...(g.ext
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {g.t}
                  </a>
                )
              ) : (
                <span key={i} className={g.tone ? `tm-${g.tone}` : undefined}>
                  {g.t}
                </span>
              ),
            )}
          </p>
        ))}
        <form
          className="tm-prompt"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <label htmlFor={inputId}>
            <span className="tm-accent">ayan@after-hours</span>
            <span className="tm-muted">:~$</span>
            <span className="sr-only"> command</span>
          </label>
          <input
            ref={inputRef}
            id={inputId}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setHint("");
            }}
            onKeyDown={onKey}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            className="tm-input"
            aria-describedby={hint ? `${inputId}-hint` : undefined}
          />
        </form>
        {hint && (
          <p id={`${inputId}-hint`} className="tm-line tm-muted">
            {hint}
          </p>
        )}
      </div>
      <div className="tm-quick" aria-label="Quick commands">
        {quick.map((q) => (
          <button
            key={q}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              run(q);
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
