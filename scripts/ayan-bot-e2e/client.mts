import { solve } from "../../src/lib/ayan-bot/solve.ts";
const BASE = "http://localhost:3031";
const H = {
  "Content-Type": "application/json",
  Origin: BASE,
  "User-Agent": "e2e-test",
};
export async function ticket() {
  const r = await fetch(BASE + "/api/ayan-bot/challenge", {
    method: "POST",
    headers: H,
    body: "{}",
  });
  const j = await r.json();
  if (!j.ticket) return { ticket: "", nonce: "", j };
  return { ticket: j.ticket, nonce: await solve(j.ticket, j.bits), j };
}
export async function ask(
  q: string,
  t?: { ticket: string; nonce: string } | null,
  extraH: Record<string, string> = {},
  page?: string,
) {
  const r = await fetch(BASE + "/api/ayan-bot", {
    method: "POST",
    headers: { ...H, ...extraH },
    body: JSON.stringify({
      messages: [{ role: "user", content: q }],
      ticket: t?.ticket,
      nonce: t?.nonce,
      page,
    }),
  });
  return {
    status: r.status,
    mode: r.headers.get("x-ayan-bot-mode"),
    left: r.headers.get("x-ayan-bot-remaining"),
    budget: r.headers.get("x-ayan-bot-budget"),
    text: await r.text(),
  };
}
export const calls = async () =>
  Number(await (await fetch("http://127.0.0.1:4555/calls")).text());
