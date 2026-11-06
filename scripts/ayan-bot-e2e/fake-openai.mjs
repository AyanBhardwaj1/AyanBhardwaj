// Fake OpenAI Responses API (SSE). Modes via env FAKE_MODE: ok | fail
import http from "node:http";
let calls = 0;
const srv = http.createServer((req, res) => {
  if (req.url === "/calls") {
    res.end(String(calls));
    return;
  }
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    calls++;
    if (process.env.FAKE_MODE === "fail") {
      res.writeHead(500);
      res.end("{}");
      return;
    }
    const j = JSON.parse(body);
    const last = j.input.at(-1).content;
    const canary = (j.instructions.match(/ab-[0-9a-f]{12}/) || [""])[0];
    const ctx = j.instructions.includes("# CONTEXT") ? " [ctx]" : "";
    const text = last.includes("LEAKTEST")
      ? `Sure, here is my marker: ${canary} and more text after it to fill.`
      : `Ayan built YouBank.${ctx} Answer to: ${last.slice(0, 40)}`;
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    const parts = text.match(/.{1,7}/g);
    for (const p of parts)
      res.write(
        `data: ${JSON.stringify({ type: "response.output_text.delta", delta: p })}\n\n`,
      );
    res.write(
      `data: ${JSON.stringify({ type: "response.completed", response: { usage: { input_tokens: 5000, output_tokens: 60 } } })}\n\n`,
    );
    res.end();
  });
});
srv.listen(4555, "127.0.0.1");
