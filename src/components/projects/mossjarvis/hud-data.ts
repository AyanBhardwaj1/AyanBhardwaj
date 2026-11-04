/**
 * Demo memories and canned turns for the in-page HUD. Recall over these is
 * real (the app's own scoring, run in the browser); the replies are scripted
 * because no model is attached to a portfolio page.
 */

export type MemType =
  "system" | "conversation-turn" | "conversation-summary" | "fact" | "task";

export type Memory = { id: string; type: MemType; text: string };

export type Task = {
  title: string;
  due: string | null;
  recurrence: string | null;
  priority: "high" | "medium" | "low";
  isNew?: boolean;
};

/** Recent raw turns, newest last (the app keeps the latest 40). */
export const WORKING: Memory[] = [
  {
    id: "t-31",
    type: "conversation-turn",
    text: "Can you summarise the Moss SDK docs I imported yesterday?",
  },
  {
    id: "t-32",
    type: "conversation-turn",
    text: "Move the demo recording to Wednesday, the launch stays Thursday.",
  },
  {
    id: "t-33",
    type: "conversation-turn",
    text: "Which model am I using for the briefing right now?",
  },
  {
    id: "t-34",
    type: "conversation-turn",
    text: "Add the YouTube talk on vector search to my second brain.",
  },
  {
    id: "t-35",
    type: "conversation-turn",
    text: "What did the launch checklist say about the offline story?",
  },
  {
    id: "t-36",
    type: "conversation-turn",
    text: "Note that the overlay should stay on top of full-screen apps.",
  },
];

/** Durable documents in the Moss local index. */
export const LONG_TERM: Memory[] = [
  {
    id: "f-launch",
    type: "fact",
    text: "Decision: ship the launch post on Thursday, after the demo video is final. Lead with offline recall.",
  },
  {
    id: "s-launch",
    type: "conversation-summary",
    text: "Discussed the launch plan: one post, one demo video, and the second brain graph as the hero shot.",
  },
  {
    id: "f-brief",
    type: "fact",
    text: "Preference: morning briefings should be short and list overdue tasks first.",
  },
  {
    id: "f-model",
    type: "fact",
    text: "The default OpenRouter model is openai/gpt-4.1-mini; any model slug can be selected in CONFIG.",
  },
  {
    id: "s-docs",
    type: "conversation-summary",
    text: "Imported the Moss docs: SessionIndex for local queries, loadIndex for cloud snapshots.",
  },
  {
    id: "k-update",
    type: "task",
    text: "Task: send the weekly update to the team. Priority medium.",
  },
  {
    id: "f-overlay",
    type: "fact",
    text: "The Tauri overlay is frameless, transparent and always on top.",
  },
  {
    id: "s-vector",
    type: "conversation-summary",
    text: "Saved notes from a talk on vector search: cosine similarity, top-k recall and hybrid ranking.",
  },
  {
    id: "y-boot",
    type: "system",
    text: "System: JARVIS second brain initialised with Moss local and cloud indexes.",
  },
  {
    id: "f-voice",
    type: "fact",
    text: "Voice is optional: Porcupine wake word, Cheetah speech to text, ElevenLabs speech.",
  },
];

export const START_TASKS: Task[] = [
  {
    title: "Record the demo video",
    due: "WED 14:00",
    recurrence: null,
    priority: "high",
  },
  {
    title: "Send the weekly update",
    due: "FRI 17:00",
    recurrence: "weekly",
    priority: "medium",
  },
];

export type Preset = {
  prompt: string;
  response: string;
  facts: string[];
  tasks: Task[];
};

export const PRESETS: Preset[] = [
  {
    prompt: "What did I decide about the launch?",
    response:
      "You decided to ship the launch post on Thursday, once the demo video is final, and to lead with the offline recall story.",
    facts: [],
    tasks: [],
  },
  {
    prompt: "Remind me to send the update tomorrow 9am",
    response:
      "Done. It's in the Task Matrix for tomorrow at 09:00, medium priority.",
    facts: [],
    tasks: [
      {
        title: "Send the update",
        due: "TOMORROW 09:00",
        recurrence: null,
        priority: "medium",
      },
    ],
  },
  {
    prompt: "I prefer briefings before 8am, keep them short",
    response:
      "Noted. Briefings will stay short and arrive before 08:00, overdue items first.",
    facts: ["Prefers short briefings before 08:00"],
    tasks: [],
  },
];

export const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "what",
  "did",
  "about",
  "with",
  "that",
  "this",
  "you",
  "can",
  "are",
  "was",
  "how",
  "into",
  "from",
  "my",
  "me",
  "to",
]);
