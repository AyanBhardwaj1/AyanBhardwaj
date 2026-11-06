import { ask, ticket, calls } from "./client.mts";
const ok = (c: boolean, m: string) => {
  if (!c) process.exitCode = 1;
  console.log((c ? "PASS " : "FAIL ") + m);
};
const st = [];
for (let i = 0; i < 7; i++) {
  const r = await ask("q " + i, await ticket());
  st.push(r.status + "/" + r.mode);
}
console.log(st.join(" "));
ok(
  (await calls()) === 5,
  "breaker opened after 5 upstream failures (calls=" + (await calls()) + ")",
);
const t = await ticket();
ok(t.j.mode === "offline", "challenge reports offline while breaker is open");
