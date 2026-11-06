import { ask, ticket, calls } from "./client.mts";
const ok = (c: boolean, m: string) => console.log((c ? "PASS " : "FAIL ") + m);
const ts = await Promise.all(Array.from({ length: 10 }, () => ticket()));
const rs = await Promise.all(ts.map((t, i) => ask("burst " + i, t)));
const live = rs.filter((r) => r.text.includes("Ayan built YouBank")).length;
console.log(
  "statuses",
  rs.map((r) => r.status + (r.budget ? ":" + r.budget : "")).join(" "),
);
ok(
  live <= 2 && (await calls()) === live,
  `10 concurrent requests, budget for ~2 worst cases: ${live} live answers, ${await calls()} upstream calls`,
);
