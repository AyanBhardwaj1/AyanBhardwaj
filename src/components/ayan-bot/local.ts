import { projects } from "@/content/content";
import { brief } from "@/lib/ayan-bot/mock";
import { PROJECT_PAGES, type ProjectSlug } from "@/lib/projects";
import { projectQuestions } from "./derive";

/**
 * Answers the panel can give without the server: the canned briefs (the same
 * ones offline mode serves) plus the page-aware starter questions, composed
 * straight from content.ts. Used when the visitor is out of messages or the
 * live model is unavailable, so the suggested questions and the recruiter
 * brief keep working. Facts only, no model, no tokens.
 */

const projectAnswers = new Map<string, string>();

for (const slug of PROJECT_PAGES as readonly ProjectSlug[]) {
  const p = projects.find((x) => x.id === slug)!;
  const q = projectQuestions(slug);
  const link = `[${p.name} case study](/projects/${slug})`;
  const steps = p.howItWorks?.slice(0, 3) ?? [];
  projectAnswers.set(
    q.work,
    `**${p.name}**: ${p.description}${steps.length ? `\n\n${steps.map((s) => `- ${s}`).join("\n")}` : ""}\n\nMore in the ${link}.`,
  );
  projectAnswers.set(
    q.stack,
    `**${p.name}** runs on ${p.stack.join(", ")}. The ${link} walks through how the pieces fit.`,
  );
  if (q.numbers && p.metrics?.length)
    projectAnswers.set(
      q.numbers,
      `The numbers behind **${p.name}**:\n${p.metrics.map((m) => `- ${m}`).join("\n")}\n\nDetails in the ${link}.`,
    );
  if (q.where)
    projectAnswers.set(
      q.where,
      `**${p.name}**: ${p.context ?? `built at ${p.builtAt}`}. ${p.tagline} More in the ${link}.`,
    );
  projectAnswers.set(
    q.more,
    `**${p.name}**: ${p.tagline} ${p.description}\n\nFull story in the ${link}.`,
  );
}

export function localAnswer(question: string): string | null {
  return projectAnswers.get(question.trim()) ?? brief(question);
}
