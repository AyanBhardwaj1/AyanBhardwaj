# Changelog

## feat/breathtaking (Nov 6, 2026)

### ayan-bot: spend caps and security

- **Hard dollar cap.** Every model call first reserves its worst-case cost
  against a daily ($0.50) and monthly ($5) budget, atomically, and settles to
  the real token usage afterwards. Over budget, the bot answers from free
  saved briefs and never calls the model. Configurable; unknown models are
  priced conservatively.
- **Shared counters** in Upstash Redis (Vercel Marketplace) so caps and rate
  limits hold across serverless instances; fails closed if configured but
  unreachable.
- **Proof-of-work tickets**: single-use, signed, bound to the visitor, solved
  in the background in the browser; harder as the day's budget runs down.
- Fetch-metadata and origin checks, a broader injection filter, a circuit
  breaker, a kill switch (`AYAN_BOT_DISABLED=1`) and an output guard (canary
  marker + key patterns) that cuts a leaking reply before it is sent.
- `npm run test:bot`: the real route against loopback fakes of OpenAI and
  Upstash (7 suites, 40 checks, no credits spent). See `docs/AYAN-BOT.md`.

### ayan-bot: features

- Page-aware answers and starters (each case study, `/cv`, `/terminal`,
  `/functions`), inline project cards, follow-up chips, a recruiter brief
  (SWE / AI / Fintech), copy, read aloud, save chat as Markdown, select any
  text to ask about it, ⌘J / Ctrl+J, and a usage meter.

### Motion and delight

- WebGL "after-hours" contour field behind the hero (and the 404), loaded on
  idle, static under reduced motion / no WebGL / slow GPUs.
- Section titles decode from terminal glyphs; the hero name drifts apart as it
  scrolls away.
- `TOUR <GO>`: a 40-second guided tour (also "or take the 40-second tour"
  under the hero buttons).
- Easter eggs: `RAIN`, `BELL`, the Konami code; the case-study tracker rings
  the closing bell when all seven are explored.
- Runway's card plays its demo recording on hover.

### New pages

- `/terminal`: a command line over the site (`whoami`, `ls projects`,
  `ls projects ai`, `cat youbank`, `grep pytorch`, `neofetch`, `open resume`,
  `fit …`, `ask …`).
- `/cv`: a web CV generated from the same content, print-ready.

### For recruiters

- **Fit check** (`FIT <GO>`, on `/cv`): paste a job description and see
  which requirements the site's own projects and roles back up, with links
  as evidence, and which it doesn't show. Runs in the browser; nothing is
  sent. `fit <text>` does the same in the terminal, and `fit ask` hands the
  result to ayan-bot. Paste a job description into ayan-bot and it offers to
  hand the whole thing to the Fit check instead.
- **Tailor the CV** for a role (`/cv?for=fintech`): matching projects first,
  plus a few more that fit; Print / save as PDF keeps it.
- **Role filter** on the projects section (AI, Fintech, Systems, Full-stack,
  Research).
- **`draft --to ayan`** in Contact writes a clear first email and opens it in
  your own mail app (or copies it).
- **Share** button on every case study; `j` / `k` jump between home sections.
- **Save contact** (`VCF <GO>`): a vCard built from the site's content.
- The 404 page suggests the page you probably meant (`/termnal` → Terminal).

### Accessibility and performance

- axe clean on every route in both themes; Lighthouse accessibility 100.
- `MOTION <GO>` turns animation down site-wide, matching the OS setting
  exactly (CSS and JS).
- Hero fits a 1280×720 laptop fold; composited animations on YouBank;
  terminal boot in the server HTML (Lighthouse 91 → 100).

### Testing

- `npm run test:smoke`: 69 browser checks against a production build (every
  route renders without errors, metadata and share images, palette,
  terminal, Fit check, ayan-bot in mock mode, reduced motion, keyboard,
  endpoints). It caught `/functions` missing its share
  image.

### SEO and plumbing

- Branded share cards for every case study, `/terminal` and `/cv`; JSON-LD
  (Person, WebSite, ProfilePage, project pages); `security.txt`; weekly
  GitHub data refresh workflow; API routes `noindex`.

### Fixes

- Mycelium graph no longer pins nodes into a rectangle; YouBank phone
  screenshots no longer show an error state; Walk-Free "Scenic" card filled
  in; plus the findings from two code reviews and a full QA pass.
