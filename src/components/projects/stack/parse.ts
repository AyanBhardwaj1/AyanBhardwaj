/**
 * A small rule parser in the spirit of Stack's Quick Capture: one line in,
 * one typed item out. Written for this page; Stack's own parser is not public.
 * Deterministic (no "today"), so server and client render the same thing.
 */

export type Captured = {
  kind:
    "Assignment" | "Flashcard" | "Problem" | "Application" | "Task" | "Note";
  fields: [string, string][];
  filed: string;
};

const DAYS: Record<string, string> = {
  mon: "Mon",
  monday: "Mon",
  tue: "Tue",
  tues: "Tue",
  tuesday: "Tue",
  wed: "Wed",
  wednesday: "Wed",
  thu: "Thu",
  thur: "Thu",
  thurs: "Thu",
  thursday: "Thu",
  fri: "Fri",
  friday: "Fri",
  sat: "Sat",
  saturday: "Sat",
  sun: "Sun",
  sunday: "Sun",
  today: "Today",
  tonight: "Today",
  tomorrow: "Tomorrow",
  tmrw: "Tomorrow",
};

const title = (t: string) =>
  t
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());

function parseTime(t: string) {
  const m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!m) return null;
  return `${m[1]}:${m[2] ?? "00"} ${m[3].toUpperCase()}`;
}

export function capture(raw: string): Captured | null {
  const line = raw.trim();
  if (!line) return null;

  const qa = line.match(/^q:\s*(.+?)\s+a:\s*(.+)$/i);
  if (qa) {
    return {
      kind: "Flashcard",
      fields: [
        ["Front", qa[1]],
        ["Back", qa[2]],
        ["First review", "in 10 minutes"],
      ],
      filed: "Flashcards › Inbox deck",
    };
  }

  const app = line.match(
    /\bapplied\s+(?:to|at)\s+([^,]+?)(?:,\s*|\s+for\s+)(.+)$/i,
  );
  if (app) {
    return {
      kind: "Application",
      fields: [
        ["Company", title(app[1])],
        ["Role", app[2].trim()],
        ["Stage", "Applied"],
      ],
      filed: "Applications › Applied",
    };
  }

  const lc = line.match(/\b(?:leetcode|lc)\s*#?(\d{1,4})\b\s*(.*)$/i);
  if (lc) {
    return {
      kind: "Problem",
      fields: [
        ["Problem", `${lc[1]}${lc[2] ? ` · ${title(lc[2])}` : ""}`],
        [
          "Status",
          /\bredo|again|re-?solve\b/i.test(line) ? "To re-solve" : "To solve",
        ],
        ["Schedule", "Re-solve queue"],
      ],
      filed: "Coding practice",
    };
  }

  // "PS 5 for CS 61B": prefer the code after for/in, so "PS 5" stays the title.
  const course =
    line.match(/\b(?:for|in)\s+([a-z]{2,5})\s?(\d{1,3}[a-z]?)\b/i) ??
    line.match(/\b([a-z]{2,5})\s?(\d{1,3}[a-z]?)\b(?=.*\bdue\b)/i);
  const due = line.match(/\bdue\s+(\w+)/i);
  const dayWord = due?.[1]?.toLowerCase();
  const day = dayWord ? DAYS[dayWord] : undefined;
  const time = parseTime(line);

  if (
    course &&
    (due ||
      /\b(ps|pset|hw|lab|essay|project|quiz|midterm|final|reading)\b/i.test(
        line,
      ))
  ) {
    const code = `${course[1].toUpperCase()} ${course[2].toUpperCase()}`;
    const name = line
      .replace(course[0], "")
      .replace(/\bdue\b.*$/i, "")
      .trim();
    return {
      kind: "Assignment",
      fields: [
        ["Title", name ? title(name) : "Untitled"],
        ["Class", code],
        ["Due", day ? `${day}${time ? ` · ${time}` : ""}` : "No date yet"],
      ],
      filed: `Classes › ${code} › Assignments`,
    };
  }

  if (due) {
    return {
      kind: "Task",
      fields: [
        ["Title", title(line.replace(/\bdue\b.*$/i, "")) || "Untitled"],
        ["Due", day ? `${day}${time ? ` · ${time}` : ""}` : due[1]],
      ],
      filed: "Deadlines",
    };
  }

  return {
    kind: "Note",
    fields: [["Title", line.length > 60 ? `${line.slice(0, 57)}…` : line]],
    filed: "Inbox",
  };
}

export const EXAMPLES = [
  "PS 5 for CS 61B due friday 11:59pm",
  "Q: What is the parent of index k in a heap? A: k / 2",
  "redo leetcode 207 course schedule",
  "applied to Juniper Robotics, product intern",
  "ask Prof. Lee about the reading list",
];
