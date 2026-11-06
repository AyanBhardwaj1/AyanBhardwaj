// Which terminal commands a shared /terminal?run= link may replay.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  COMMANDS,
  EXAMPLES,
  linkSafe,
} from "../../src/lib/terminal-commands.ts";

test("read-only commands run from a link", () => {
  for (const c of [
    "top",
    "  top",
    "grep rust",
    "diff youbank runway",
    "cat youbank",
    "fit Python, React",
    "history",
    "man diff",
  ])
    assert.ok(linkSafe(c), c);
});

test("anything that spends credits, navigates or erases never does", () => {
  for (const c of [
    "ask what did he build",
    "ASK hi",
    "fit ask",
    "FIT\tASK",
    "fit ask please",
    "open resume",
    "cv fintech",
    "tour",
    "exit",
    "history -c",
    "history -c",
    "share",
    "sudo hire ayan",
    "",
  ])
    assert.ok(!linkSafe(c), JSON.stringify(c));
});

test("every example belongs to a listed command", () => {
  const names = new Set(COMMANDS.map((c) => c.name));
  for (const k of Object.keys(EXAMPLES)) assert.ok(names.has(k), k);
});
