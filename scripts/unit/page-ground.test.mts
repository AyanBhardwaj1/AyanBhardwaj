// The head script's dark-page list matches the case studies that set
// barTheme="dark" (otherwise the launcher flashes light while hydrating).
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { DARK_GROUND_SLUGS } from "../../src/lib/page-ground.ts";

test("DARK_GROUND_SLUGS lists exactly the dark case studies", () => {
  const dir = new URL("../../src/app/projects/", import.meta.url);
  const dark = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) => {
      try {
        const src = readFileSync(new URL(`${slug}/page.tsx`, dir), "utf8");
        return /barTheme="dark"/.test(src);
      } catch {
        return false;
      }
    })
    .sort();
  assert.deepEqual([...DARK_GROUND_SLUGS].sort(), dark);
});
