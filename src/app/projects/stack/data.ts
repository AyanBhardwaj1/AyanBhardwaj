/**
 * Copy for /projects/stack ("SHAPESHIFTER"). Product claims come from the
 * public landing page at stack-workspace.vercel.app. The source is private, so
 * anything about how it's built is labelled as read from the public bundle.
 */

export const intro =
  "Tell Stack what you study and what you want from this term, and it sets up your modules, starter pages, dashboard and look to match. Notes, deadlines and databases sit in one place, and an AI tutor quizzes you on what you actually wrote down.";

export const styleNotes: Record<string, string> = {
  terminal: "Dark, monospaced, built around code blocks.",
  ledger: "A serif broadsheet on salmon paper, with figures that line up.",
  journal: "An old reading notebook in modern type.",
  lab: "Crisp, gridded and exact.",
  atelier: "Soft colour, round corners, room for images.",
  studio: "The default: clean and quiet.",
};

export const features: { title: string; body: string }[] = [
  {
    title: "Set up by your major",
    body: 'A three-step onboarding asks what you do, what you study and what you want this term: land an internship, do well on exams, keep up with readings or ship a side project. "Finance, minor in statistics" starts you in Ledger with Classes, Deadlines, Flashcards and Applications, plus a recruiting tracker and an exam review plan.',
  },
  {
    title: "Notes that hold a semester",
    body: "Nested pages and a / menu for headings, to-dos, highlighted code and LaTeX math. Databases with table, board, calendar and gallery views. Full-text search on ⌘K, several workspaces, and a study group you can invite.",
  },
  {
    title: "An AI that tests you on your notes",
    body: "Quiz me writes questions from your pages, grades your typed answer against what the notes say and quotes them back. Every miss becomes a flashcard. Ask your notes answers with the source pages cited; Plan my week and Syllabus to deadlines do the admin.",
  },
  {
    title: "Review before you forget",
    body: "Spaced-repetition flashcards, coding problems on a re-solve schedule, a seven-day deadline strip, an internship board from applied to offer, and a projects hub.",
  },
  {
    title: "School deadlines, synced",
    body: "Paste each course's calendar feed from Canvas, Blackboard, Moodle, Brightspace, Schoology or Google Classroom. It is checked daily and de-duplicated, and a private iCal feed goes back out to Google or Apple Calendar. A daily digest can post to Slack or Discord.",
  },
  {
    title: "Yours only",
    body: "Each account's data is isolated, and Ask and Quiz search only your own pages. Signing up asks for an email and a password, nothing else.",
  },
];

export const bundle: [string, string][] = [
  [
    "App",
    "React single-page app built with Vite, installable as a PWA, hosted on Vercel",
  ],
  [
    "Editor",
    "BlockNote on Tiptap and ProseMirror, KaTeX for math, Shiki for code highlighting",
  ],
  ["Calendars", "iCal parsing for course feeds and an outgoing private feed"],
  [
    "Routes",
    "Same-origin API routes for SSO sign-in, public pages and forms, CSV export of databases, and webhooks",
  ],
  [
    "Styles",
    "About 25 variable web fonts behind the style system, from Newsreader and EB Garamond to JetBrains Mono",
  ],
];

export const media = {
  lead: {
    src: "/media/projects/stack/hero-terminal-style.jpg",
    alt: "Stack's landing page with the computer science style: a dark, monospaced page titled Lecture 14: Heaps, with a Java code block and cards for work due this week",
    width: 1440,
    height: 900,
  },
  styles: [
    {
      src: "/media/projects/stack/hero-ledger-style.jpg",
      alt: "The finance style, Ledger: salmon paper, a serif heading for discounted cash flow, a present value formula and a cash flow table",
      width: 1440,
      height: 900,
    },
    {
      src: "/media/projects/stack/hero-journal-style.jpg",
      alt: "The government style, Journal: a cream notebook page in serif type",
      width: 1440,
      height: 900,
    },
    {
      src: "/media/projects/stack/hero-atelier-style.jpg",
      alt: "The design style, Atelier: a pink page with round corners for poster critique prep",
      width: 1440,
      height: 900,
    },
  ],
  screens: [
    {
      src: "/media/projects/stack/quiz-me.jpg",
      alt: "Quiz me: a correct answer in green and a missed one in red that quotes the note and is added to flashcards",
      width: 1440,
      height: 900,
    },
    {
      src: "/media/projects/stack/quick-capture.jpg",
      alt: "Quick Capture parsing a line about a problem set into an assignment with class and due date",
      width: 1440,
      height: 900,
    },
    {
      src: "/media/projects/stack/notes-slash-menu-board.jpg",
      alt: "The slash menu with headings, to-dos, code and math, next to an assignments board",
      width: 1440,
      height: 900,
    },
    {
      src: "/media/projects/stack/review-flashcards-week.jpg",
      alt: "A flashcard with Again, Hard, Good and Easy intervals, a week strip, coding practice and an internship board",
      width: 1440,
      height: 900,
    },
    {
      src: "/media/projects/stack/onboarding-appearance.jpg",
      alt: "Onboarding step two of three beside the appearance panel: accent colours, font, corners, density and theme",
      width: 1440,
      height: 900,
    },
    {
      src: "/media/projects/stack/note-graph.jpg",
      alt: "The note graph: solid lines for links you made and dashed blue lines for connections Stack found",
      width: 1440,
      height: 900,
    },
  ],
};
