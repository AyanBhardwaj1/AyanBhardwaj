// Browser smoke tests for the production build. Run via scripts/smoke/run.sh,
// which starts `next start` on loopback with AYAN_BOT_MOCK=1 and sets
// SMOKE_BASE. Plain Node ESM: `SMOKE_BASE=http://127.0.0.1:3041 node <this>`.
//
// Every check prints PASS/FAIL <group>: <name>. A failure sets exitCode = 1.
// One browser; each group gets a fresh context.

import { appendFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try {
  // Installed globally (NODE_PATH), which ESM `import` does not search.
  ({ chromium } = require("playwright"));
} catch {
  console.error("smoke: Playwright not found (require('playwright') failed).");
  process.exit(2);
}

const BASE = (process.env.SMOKE_BASE ?? "http://127.0.0.1:3041").replace(
  /\/$/,
  "",
);
const CHECK_TIMEOUT = 60_000;
const SKIP = new Set(
  (process.env.SMOKE_SKIP ?? "").split(",").map((x) => x.trim()),
);

const PROJECTS = [
  "youbank",
  "mossjarvis",
  "mycelium",
  "walk-free",
  "runway",
  "oncosense",
  "stack",
];
const ROUTES = [
  "/",
  "/functions",
  "/terminal",
  "/cv",
  "/nope",
  ...PROJECTS.map((p) => `/projects/${p}`),
];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

let passed = 0;
let failed = 0;

class CheckError extends Error {}
function assert(cond, msg) {
  if (!cond) throw new CheckError(msg);
}

/** Runs one named check with a hard time limit; never throws. */
async function check(group, name, fn) {
  let timer;
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new CheckError(`timed out after ${CHECK_TIMEOUT}ms`)),
          CHECK_TIMEOUT,
        );
      }),
    ]);
    passed++;
    console.log(`PASS ${group}: ${name}`);
  } catch (e) {
    failed++;
    process.exitCode = 1;
    const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
    console.log(`FAIL ${group}: ${name}\n     ${msg}`);
  } finally {
    clearTimeout(timer);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Polls fn until it returns truthy or the deadline passes. */
async function until(fn, ms = 10_000, step = 100) {
  const end = Date.now() + ms;
  let last;
  while (Date.now() < end) {
    last = await fn();
    if (last) return last;
    await sleep(step);
  }
  return last;
}

/** Any absolute URL, moved onto the local server (keeps path and query). */
const local = (u) => {
  const url = new URL(u, BASE);
  return BASE + url.pathname + url.search;
};

const pathOf = (u) => new URL(u, BASE).pathname.replace(/(.)\/$/, "$1");

async function newContext(browser, opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...opts,
  });
  ctx.setDefaultTimeout(15_000);
  ctx.setDefaultNavigationTimeout(30_000);
  return ctx;
}

/** Scrolls to the bottom in viewport steps, then back to the top. */
async function scrollThrough(page, pause = 80) {
  await page.evaluate(async (pause) => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    let y = 0;
    for (let i = 0; i < 80; i++) {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (y >= max) break;
      y = Math.min(max, y + innerHeight * 0.8);
      window.scrollTo({ top: y, behavior: "instant" });
      await wait(pause);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await wait(pause);
  }, pause);
}

/**
 * Waits until the client has hydrated, by pressing a shortcut handled in a
 * React effect until `opened` reports success. Never toggles it twice.
 */
async function pressUntil(page, key, opened, tries = 6) {
  for (let i = 0; i < tries; i++) {
    await page.keyboard.press(key);
    if (await until(opened, 4000)) return true;
  }
  return false;
}

// 1. Routes: status, errors, one <h1>, no horizontal overflow ----------------

async function routes(browser) {
  for (const vp of VIEWPORTS) {
    const ctx = await newContext(browser, {
      viewport: { width: vp.width, height: vp.height },
      ...(vp.name === "mobile" ? { isMobile: true, hasTouch: true } : {}),
    });
    for (const route of ROUTES) {
      await check("routes", `${route} @${vp.width}x${vp.height}`, async () => {
        const page = await ctx.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
        page.on("console", (m) => {
          if (m.type() !== "error") return;
          const t = m.text();
          if (/preloaded .* but not used/i.test(t)) return;
          if (route === "/nope" && /status of 404/.test(t)) return;
          errors.push(`console: ${t}`);
        });
        try {
          const res = await page.goto(BASE + route, { waitUntil: "load" });
          const want = route === "/nope" ? 404 : 200;
          assert(res, "no response");
          assert(res.status() === want, `status ${res.status()}, want ${want}`);
          await sleep(500);
          await scrollThrough(page);
          await sleep(300);
          const h1 = await page.locator("h1").count();
          assert(h1 === 1, `${h1} <h1> elements, want exactly 1`);
          const overflow = await page.evaluate(() => {
            const d = document.documentElement;
            if (d.scrollWidth <= d.clientWidth + 1) return null;
            // Name the widest offenders to make the failure actionable.
            const out = [];
            for (const el of document.body.querySelectorAll("*")) {
              const r = el.getBoundingClientRect();
              if (r.right > d.clientWidth + 1 && r.width > 0) {
                const id = el.id ? `#${el.id}` : "";
                const cls =
                  typeof el.className === "string" && el.className
                    ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
                    : "";
                out.push(`${el.tagName.toLowerCase()}${id}${cls}`);
                if (out.length >= 3) break;
              }
            }
            return `scrollWidth ${d.scrollWidth} > ${d.clientWidth} (${out.join(", ")})`;
          });
          assert(!overflow, `horizontal overflow: ${overflow}`);
          assert(errors.length === 0, errors.slice(0, 3).join(" | "));
        } finally {
          await page.close();
        }
      });
    }
    await ctx.close();
  }
}

// 2. Metadata ---------------------------------------------------------------

async function metadata(browser) {
  // Server HTML only: what crawlers and link unfurlers see.
  const ctx = await newContext(browser, { javaScriptEnabled: false });
  const page = await ctx.newPage();
  const images = new Map();
  for (const route of ROUTES) {
    await check("metadata", route, async () => {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
      const m = await page.evaluate(() => {
        const attr = (sel, a) =>
          document.querySelector(sel)?.getAttribute(a) ?? null;
        return {
          title: document.title,
          description: attr('meta[name="description"]', "content"),
          canonical: attr('link[rel="canonical"]', "href"),
          ogImage: attr('meta[property="og:image"]', "content"),
        };
      });
      assert(m.title.trim(), "missing <title>");
      assert(m.description?.trim(), "missing meta description");
      if (route === "/nope") return; // 404: deliberately no canonical.
      assert(m.canonical, "missing canonical link");
      assert(
        pathOf(m.canonical) === route,
        `canonical points at ${m.canonical}, not ${route}`,
      );
      assert(m.ogImage, "missing og:image");
      images.set(m.ogImage, route);
    });
  }
  await check("metadata", `og:images return 200 image/png`, async () => {
    assert(images.size > 0, "no og:image URLs collected");
    const bad = [];
    for (const [img, route] of images) {
      const res = await fetch(local(img));
      const type = res.headers.get("content-type") ?? "";
      if (res.status !== 200 || !type.startsWith("image/png"))
        bad.push(`${route}: ${pathOf(img)} -> ${res.status} ${type}`);
      await res.arrayBuffer();
    }
    assert(!bad.length, bad.join("; "));
  });
  await check("metadata", "home JSON-LD has @type Person", async () => {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    assert(blocks.length, "no JSON-LD script on /");
    const types = [];
    const walk = (v) => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (v && typeof v === "object") {
        if (v["@type"]) types.push(...[].concat(v["@type"]));
        Object.values(v).forEach(walk);
      }
    };
    for (const b of blocks) walk(JSON.parse(b));
    assert(types.includes("Person"), `@types found: ${types.join(", ")}`);
  });
  await ctx.close();
}

// 3. Command palette --------------------------------------------------------

async function palette(browser) {
  const ctx = await newContext(browser);
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "load" });
  const dialog = page.getByRole("dialog", { name: "Command palette" });
  const isOpen = () => dialog.isVisible();
  /** Opens with Ctrl+K and waits for the input to take focus (else keys are lost). */
  const open = async () => {
    assert(await pressUntil(page, "Control+k", isOpen), "no dialog opened");
    const input = dialog.getByRole("combobox");
    assert(
      await until(() => input.evaluate((el) => el === document.activeElement)),
      "palette input is not focused",
    );
  };

  await check("palette", "Ctrl+K opens the palette", open);

  await check(
    "palette",
    "HELP <GO> prints help mentioning TERM and TOUR",
    async () => {
      assert(await isOpen(), "palette not open");
      await page.keyboard.type("HELP");
      await page.keyboard.press("Enter");
      const help = dialog.locator("p", { hasText: /\bTOUR\b/ });
      await help.first().waitFor({ state: "visible", timeout: 5000 });
      const text = (await dialog.locator("p").allInnerTexts()).join("\n");
      assert(/\bTOUR\b/.test(text), "help text does not mention TOUR");
      assert(/\bTERM\b/.test(text), "help text does not mention TERM");
    },
  );

  await check("palette", "Esc closes the palette", async () => {
    await page.keyboard.press("Escape");
    assert(await until(async () => !(await isOpen()), 3000), "still open");
  });

  await check("palette", "PROJ <GO> scrolls to #projects", async () => {
    await open();
    await page.keyboard.type("PROJ");
    // Enter only once the list has filtered to the PROJ row, so a slow
    // network can't race the keystroke.
    await until(() =>
      dialog
        .locator("[cmdk-item][data-selected='true']", { hasText: "PROJ" })
        .count()
        .then((n) => n > 0 || null),
    );
    await page.keyboard.press("Enter");
    const top = await until(
      () =>
        page.evaluate(() => {
          const el = document.getElementById("projects");
          if (!el) return "missing";
          const t = el.getBoundingClientRect().top;
          return Math.abs(t) < innerHeight * 0.3 && scrollY > 200 ? "ok" : null;
        }),
      8000,
    );
    assert(top !== "missing", "no #projects element on /");
    assert(top === "ok", "#projects did not scroll into view");
    assert(!(await isOpen()), "palette still open after PROJ");
  });
  await ctx.close();
}

// 4. ayan-bot (mock) --------------------------------------------------------

async function ayanBot(browser) {
  const ctx = await newContext(browser);
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "load" });
  const panel = page.getByRole("dialog", { name: /ayan-bot/i });
  const question = "What did Ayan build at Moss?";

  await check("ayan-bot", "Ctrl+J opens the panel", async () => {
    assert(
      await pressUntil(page, "Control+j", () => panel.isVisible()),
      "panel did not open",
    );
  });

  await check("ayan-bot", "mock answer about Moss streams in", async () => {
    const input = panel.getByLabel("Ask ayan-bot about Ayan");
    await input.fill(question);
    await input.press("Enter");
    const log = panel.getByRole("log", { name: /conversation/i });
    const answer = await until(async () => {
      const t = await log.innerText();
      const i = t.lastIndexOf(question);
      const after = i >= 0 ? t.slice(i + question.length) : "";
      return /Moss/.test(after) ? after : null;
    }, 20_000);
    assert(answer, "no answer mentioning Moss after the question");
  });

  await check("ayan-bot", "answer shows a project card link", async () => {
    const cards = panel.getByRole("list", { name: /case studies/i });
    const link = cards.locator(
      'a[href="/projects/mossjarvis"], a[href="/projects/mycelium"]',
    );
    await link.first().waitFor({ state: "visible", timeout: 15_000 });
  });
  await ctx.close();

  const json = { "Content-Type": "application/json", "User-Agent": "smoke" };
  await check("ayan-bot", "challenge endpoint returns JSON", async () => {
    const res = await fetch(`${BASE}/api/ayan-bot/challenge`, {
      method: "POST",
      headers: { ...json, Origin: BASE },
      body: "{}",
    });
    assert(res.status === 200, `status ${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    assert(type.includes("application/json"), `content-type ${type}`);
    const j = await res.json();
    assert(typeof j.ticket === "string", "no ticket field");
    assert(j.mode === "mock", `mode ${j.mode}, want mock`);
  });

  const chat = (origin) =>
    fetch(`${BASE}/api/ayan-bot`, {
      method: "POST",
      headers: { ...json, Origin: origin },
      body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
    });
  await check("ayan-bot", "chat without a ticket is 401", async () => {
    const res = await chat(BASE);
    await res.text();
    assert(res.status === 401, `status ${res.status}`);
  });
  await check("ayan-bot", "chat from a foreign Origin is 403", async () => {
    const res = await chat("https://evil.example");
    await res.text();
    assert(res.status === 403, `status ${res.status}`);
  });
}

// 5. Terminal ---------------------------------------------------------------

async function terminal(browser) {
  const ctx = await newContext(browser);
  const page = await ctx.newPage();
  await page.goto(BASE + "/terminal", { waitUntil: "load" });
  const input = page.getByRole("textbox", { name: /command/i });
  const log = page.getByRole("log", { name: /terminal output/i });

  /** Runs a command; returns the output printed after it. */
  const run = async (cmd, expect) => {
    const before = (await log.innerText()).length;
    await input.fill(cmd);
    await input.press("Enter");
    const out = await until(async () => {
      const t = (await log.innerText()).slice(before);
      return expect.test(t) ? t : null;
    }, 5000);
    return out;
  };

  await check("terminal", "input is focused on desktop", async () => {
    assert(
      await until(() => input.evaluate((el) => el === document.activeElement)),
      "terminal input not focused after load",
    );
  });
  await check("terminal", "help lists commands", async () => {
    const out = await run("help", /whoami/);
    assert(out, "help printed no command list");
    for (const c of ["whoami", "ls", "cat", "ask", "clear"])
      assert(new RegExp(`\\b${c}\\b`).test(out), `help is missing ${c}`);
  });
  await check("terminal", "cat yb prints YouBank", async () => {
    assert(await run("cat yb", /YouBank/), "no YouBank in output");
  });
  await check("terminal", "fit matches a job description", async () => {
    const out = await run(
      "fit Python, React, LLM agents and Kubernetes",
      /not on this site/,
    );
    assert(out, "fit printed no result");
    assert(/✓ Python/.test(out), "fit did not back Python");
    assert(/Kubernetes/.test(out), "fit did not list the Kubernetes gap");
  });
  await check("terminal", "grep finds PyTorch", async () => {
    assert(await run("grep pytorch", /\d+ match/), "grep printed no matches");
  });
  await check("terminal", "unknown command", async () => {
    assert(
      await run("frobnicate", /command not found/),
      "no 'command not found'",
    );
  });
  await check(
    "terminal",
    "Tab completes cat wal -> cat walk-free",
    async () => {
      await input.fill("cat wal");
      await input.press("Tab");
      const v = await until(async () => {
        const v = (await input.inputValue()).trim();
        return v === "cat walk-free" ? v : null;
      }, 3000);
      assert(v, `value is "${await input.inputValue()}"`);
      assert(
        await input.evaluate((el) => el === document.activeElement),
        "Tab moved focus out of the input",
      );
    },
  );
  await ctx.close();
}

async function fitCheck(browser) {
  const ctx = await newContext(browser);
  const page = await ctx.newPage();
  await page.goto(BASE + "/cv#fit", { waitUntil: "load" });
  await check("fit", "sample job description gets evidence", async () => {
    await page.getByRole("button", { name: "Try a sample" }).click();
    const summary = await until(async () => {
      const t = await page.locator("#fit").innerText();
      return /\d+ of \d+ technical requirements/.test(t) ? t : null;
    });
    assert(summary, "no fit summary after the sample");
    assert(
      (await page.locator("#fit li a[href]").count()) > 0,
      "no evidence links",
    );
  });
  await check("fit", "?for=fintech tailors the CV", async () => {
    await page.goto(BASE + "/cv?for=fintech", { waitUntil: "load" });
    const shown = await until(async () => {
      const v = await page
        .locator(".cv-item", { hasText: "QuantDesk" })
        .isVisible();
      return v || null;
    });
    assert(shown, "QuantDesk not shown when tailored for fintech");
  });
  await check("fit", "a shared #fit= link shows the result", async () => {
    await page.goto(BASE + "/cv#fit=python,rust,react|Kubernetes", {
      waitUntil: "load",
    });
    const t = await until(async () => {
      const x = await page.locator("#fit").innerText();
      return /A shared result/.test(x) ? x : null;
    });
    assert(t, "no shared-result note");
    assert(/3 of 4 technical requirements/.test(t), "wrong shared numbers");
  });
  await check("fit", "hidden when printing", async () => {
    await page.emulateMedia({ media: "print" });
    assert(!(await page.locator("#fit").isVisible()), "#fit visible in print");
    await page.emulateMedia({ media: "screen" });
  });
  await ctx.close();
}

// 6. Reduced motion ---------------------------------------------------------

async function reducedMotion(browser) {
  const ctx = await newContext(browser, { reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await check(
    "reduced-motion",
    "every [data-reveal] ends visible",
    async () => {
      await page.goto(BASE + "/", { waitUntil: "load" });
      await sleep(800);
      await scrollThrough(page, 150);
      const res = await page.evaluate(async () => {
        const frames = () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          );
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        const els = [...document.querySelectorAll("[data-reveal]")];
        const name = (el) => {
          const id = el.id || el.closest("[id]")?.id || "";
          const txt = (el.textContent ?? "").trim().slice(0, 30);
          return `${el.tagName.toLowerCase()}${id ? ` in #${id}` : ""} "${txt}"`;
        };
        const hidden = (el) => {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return false; // not rendered
          const inView = r.bottom > 0 && r.top < innerHeight;
          return inView && Number(getComputedStyle(el).opacity) < 0.5;
        };
        const bad = [];
        for (const el of els) {
          el.scrollIntoView({ block: "center", behavior: "instant" });
          await frames();
          if (!hidden(el)) continue;
          await wait(500); // grace for an observer callback
          if (hidden(el)) bad.push(name(el));
        }
        return { total: els.length, bad };
      });
      assert(res.total > 0, "no [data-reveal] elements on /");
      assert(
        res.bad.length === 0,
        `${res.bad.length}/${res.total} still hidden: ${res.bad.slice(0, 4).join("; ")}`,
      );
    },
  );
  await ctx.close();
}

// 7. Keyboard focus ---------------------------------------------------------

async function keyboard(browser) {
  const ctx = await newContext(browser);
  const page = await ctx.newPage();
  await check(
    "keyboard",
    "first 15 Tab stops on / show a focus style",
    async () => {
      await page.goto(BASE + "/", { waitUntil: "load" });
      await sleep(1000);
      const bad = [];
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press("Tab");
        await sleep(120);
        const f = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const cs = getComputedStyle(el);
          const label =
            el.getAttribute("aria-label") ||
            (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 30) ||
            el.getAttribute("href") ||
            "";
          return {
            name: `${el.tagName.toLowerCase()} "${label}"`,
            outline:
              cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0,
            shadow: cs.boxShadow !== "none",
          };
        });
        if (!f) {
          bad.push(`stop ${i + 1}: focus on <body>`);
          continue;
        }
        if (!f.outline && !f.shadow) bad.push(`stop ${i + 1}: ${f.name}`);
      }
      assert(bad.length === 0, `no visible focus: ${bad.join("; ")}`);
    },
  );
  await ctx.close();
}

// 8. Static endpoints -------------------------------------------------------

async function endpoints() {
  const cases = [
    ["/sitemap.xml", /xml/, (b) => /<urlset/.test(b)],
    ["/robots.txt", /^text\/plain/, (b) => /user-agent/i.test(b)],
    ["/llms.txt", /^text\/(plain|markdown)/, (b) => /Ayan/.test(b)],
    [
      "/resume.json",
      /^application\/(json|schema\+json)/,
      (b) => typeof JSON.parse(b) === "object",
    ],
    [
      "/manifest.webmanifest",
      /^application\/(manifest\+)?json/,
      (b) => typeof JSON.parse(b).name === "string",
    ],
    ["/.well-known/security.txt", /^text\/plain/, (b) => /^Contact:/m.test(b)],
    ["/ayan.vcf", /^text\/vcard/, (b) => /^BEGIN:VCARD/.test(b)],
    ["/cv.md", /^text\/markdown/, (b) => /^# .+\n[\s\S]*## Experience/.test(b)],
  ];
  for (const [path, type, body] of cases) {
    await check("endpoints", path, async () => {
      const res = await fetch(BASE + path);
      const t = res.headers.get("content-type") ?? "";
      const b = await res.text();
      assert(res.status === 200, `status ${res.status}`);
      assert(type.test(t), `content-type ${t}`);
      let ok = false;
      try {
        ok = body(b);
      } catch {
        ok = false;
      }
      assert(ok, `unexpected body: ${b.slice(0, 80)}`);
    });
  }
  await check("endpoints", "every function code is unique", async () => {
    const html = await (await fetch(BASE + "/functions")).text();
    const codes = [
      ...html.matchAll(/<td class="text-accent[^"]*">([^<]+?)\s*<!-- -->/g),
    ].map((m) => m[1].trim());
    assert(codes.length > 20, `found only ${codes.length} codes`);
    const dup = codes.filter((c, i) => codes.indexOf(c) !== i);
    assert(!dup.length, `duplicate codes: ${dup.join(", ")}`);
  });
  await check("endpoints", "/functions lists terminal commands", async () => {
    const html = await (await fetch(BASE + "/functions")).text();
    assert(/id="fn-terminal"/.test(html), "no /terminal section");
    assert(
      html.includes("/terminal?run=diff%20youbank%20runway"),
      "no runnable diff example",
    );
  });
  await check("endpoints", "sitemap lists /terminal and /cv", async () => {
    const b = await (await fetch(BASE + "/sitemap.xml")).text();
    const locs = [...b.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      pathOf(m[1].trim()),
    );
    for (const p of ["/terminal", "/cv"])
      assert(locs.includes(p), `sitemap has no ${p}`);
  });
}

// ---------------------------------------------------------------------------

const t0 = Date.now();
const browser = await chromium.launch();
try {
  await routes(browser);
  await metadata(browser);
  await palette(browser);
  // SMOKE_SKIP=bot skips the ayan-bot group, e.g. against production,
  // where a question would spend real API credits.
  if (!SKIP.has("bot")) await ayanBot(browser);
  await terminal(browser);
  await fitCheck(browser);
  await reducedMotion(browser);
  await keyboard(browser);
  await endpoints();
} catch (e) {
  failed++;
  process.exitCode = 1;
  console.log(`FAIL harness: ${e instanceof Error ? e.message : e}`);
} finally {
  await browser.close();
}
console.log(
  `site.test.mjs: ${passed} passed, ${failed} failed (${((Date.now() - t0) / 1000).toFixed(1)}s)`,
);
if (process.env.SMOKE_RESULT)
  appendFileSync(process.env.SMOKE_RESULT, `${passed} ${failed}\n`);
