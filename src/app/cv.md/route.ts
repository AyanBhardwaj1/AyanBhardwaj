import { cvMarkdown } from "@/lib/cv-text";

/** The web CV as Markdown. Static, like llms.txt. */
export function GET() {
  return new Response(cvMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
