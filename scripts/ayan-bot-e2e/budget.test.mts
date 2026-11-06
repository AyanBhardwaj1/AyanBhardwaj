import { ask, ticket, calls } from "./client.mts";
const ok = (c: boolean, m: string) => {
  if (!c) process.exitCode = 1;
  console.log((c ? "PASS " : "FAIL ") + m);
};
const out = [];
for (let i = 0; i < 6; i++) {
  const r = await ask("Tell me about Moss " + i, await ticket());
  out.push({
    s: r.status,
    budget: r.budget,
    mode: r.mode,
    live: r.text.includes("Ayan built YouBank"),
  });
}
console.log(JSON.stringify(out));
const liveN = out.filter((o) => o.live).length;
ok(liveN >= 1 && liveN < 6, `budget stops live calls after ${liveN} answers`);
ok(
  out.at(-1)!.budget === "exhausted" && out.at(-1)!.mode === "offline",
  "exhausted budget -> briefs/offline with header",
);
ok(
  (await calls()) === liveN,
  "upstream called exactly as many times as answers (" + (await calls()) + ")",
);
const r = await ask("What did Ayan build at Moss?", await ticket());
ok(
  r.status === 200 && r.mode === "offline",
  "common question still answered from briefs after budget: " +
    JSON.stringify(r.text.slice(0, 60)),
);
