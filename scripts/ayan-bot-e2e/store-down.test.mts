import { ask, ticket, calls } from "./client.mts";
const ok = (c: boolean, m: string) => {
  if (!c) process.exitCode = 1;
  console.log((c ? "PASS " : "FAIL ") + m);
};
const t = await ticket().catch(() => null);
ok(
  !t || !t.ticket,
  "challenge unavailable when store is down: " + JSON.stringify(t?.j ?? null),
);
const r = await ask("What did Ayan build?", { ticket: "a.1.15.b", nonce: "1" });
ok(
  r.status !== 200 || r.mode !== "live",
  "no live answer when store is down (" + r.status + ")",
);
ok((await calls()) === 0, "no upstream spend when store is down");
