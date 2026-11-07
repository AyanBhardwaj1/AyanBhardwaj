// Links to a highlighted quote (text fragments) from the selection menu.
import assert from "node:assert/strict";
import { test } from "node:test";
import { quoteLink, textFragment } from "../../src/lib/quote-link.ts";

test("short quotes are matched whole, with syntax characters escaped", () => {
  assert.equal(
    textFragment("  real-time,   low & fast "),
    "#:~:text=real%2Dtime%2C%20low%20%26%20fast",
  );
});

test("long quotes use the first and last five words", () => {
  const q =
    "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen";
  assert.equal(
    textFragment(q),
    "#:~:text=one%20two%20three%20four%20five,eleven%20twelve%20thirteen%20fourteen%20fifteen",
  );
});

test("the page's own hash is replaced, the query kept", () => {
  assert.equal(
    quoteLink("https://x.dev/cv?role=ai#fit=abc", "hello world"),
    "https://x.dev/cv?role=ai#:~:text=hello%20world",
  );
});

test("nothing to quote gives the bare page", () => {
  assert.equal(quoteLink("https://x.dev/#top", "   "), "https://x.dev/");
});

test("a quote across blocks uses its first and last lines", () => {
  assert.equal(
    textFragment("Moss · SWE intern\n\nBuilt ten open-source apps"),
    "#:~:text=Moss%20%C2%B7%20SWE%20intern,Built%20ten%20open%2Dsource%20apps",
  );
});
