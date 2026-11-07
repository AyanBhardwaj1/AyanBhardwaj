# Changelog

## After launch (Nov 6, 2026)

- **Interaction fixes**: the Fit check reads job descriptions up to 20,000
  characters (it silently cut at 8,000, then advised "paste more") and says
  when it trims; a new `#fit=` link in the same tab (edited address,
  Back/Forward) replaces the shared result; the terminal brings back your
  draft after ↑ then ↓, as bash does; the palette finds "you bank" and
  "walk free" typed as words.
- **Clickable ticker**: every symbol on the hero tape leads somewhere (YOUBANK
  and the metrics open the case study, MIT LL opens OncoSense, GH STARS jumps
  to Activity, AEO to Leadership). Mouse-only shortcuts in the aria-hidden
  tape; keyboard order is unchanged.
- **Audit fixes, launcher and edges**: the ayan-bot launcher takes the look
  of fixed-theme case studies (no cream pill on dark YouBank in light mode);
  on phones the terminal's quick-command chips end before the launcher; the
  Walk-Free case-study bar lines up with its wider editorial grid.
- **Audit fixes, charts and targets**: the YouBank autonomy chart no longer
  clips its "100%" label; the Activity row reads "13D (best)" and "Per active
  day" on one line each; the home watchlist chart fills its card (no empty
  gap) and drops a row's red/green tint when the ticker pauses; phone tap
  targets under 24px (CV back link, watchlist symbols, scroll link) grew.
- **Audit fixes, text layout**: terminal `help`, `skills` and `interests`
  stack key and text on phones instead of stranding words at the edge, and
  the ASCII banner uses system monospace (the web font has no box-drawing
  glyphs, so it sheared); long CamelCase names (LowResourceResearch) wrap at
  their humps instead of running into the description; CV event lines wrap
  on phones; `/functions` breaks commands at `|`, never mid-word; the footer
  links stay on one line on phones.
- **Case studies**: the amber reading-progress hairline now runs under the
  case-study bar too. Printing a case study drops the sticky bar, the YouBank
  command bar and ticker tape, and the MossJarvis boot overlay (which used to
  print instead of the page); gradient titles (YouBank, Mycelium) keep their
  colour on paper instead of vanishing.
- **Hero exit, scrubbed by scroll**: as the first screen scrolls away the
  name lifts, blurs and fades while the portrait rises a little faster
  (CSS scroll-driven animations; off under reduced motion and in browsers
  without `animation-timeline`).
- **Quote links**: select any text and the "Ask ayan-bot" pill gains a
  **Link** button that copies a link opening the page scrolled to that quote,
  highlighted in the site's amber (a `#:~:text=` text fragment).
- **Related work** at the end of each case study that has close relatives
  (OncoSense has none): the most similar builds,
  ranked by shared tools, category, where they were built and role lens,
  with the reason shown. `cat <project>` in the terminal lists them too.
- **Case-study navigation**: `[` / `]` step to the previous / next case
  study; the explored tracker (and, for returning visitors, the home page)
  points to one you haven't opened yet.
- **Fit check**: three sample postings (AI fintech, frontend, quant), and
  "Email Ayan about this role", which opens your mail app with the score,
  what matched and the shareable result link (never the posting).
- **First impressions** (from a live-site audit): the hero's buttons make
  the first screen on phones and laptops (smoke-checked at 390x664,
  1280x720 and 1440x900); the CV prints on one page; "Hiring? Check a job
  description" on the hero, a Fit check item in the nav, "Case study →" on
  project cards and a Hiring line at the end of each case study.
- **Phones**: on `/cv` the CV comes first and the Fit check follows; the
  home page's knowledge graph folds behind "Show all 26 projects" (it
  was a third list of the same projects), about 2,600px shorter.
- **Testing**: `npm run test:prod` runs the smoke checks against the live
  site after each deploy (skipping ayan-bot, so no credits are spent).

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
- **Answer for: recruiter | engineer**: one switch changes the depth of
  answers (impact first, or architecture and trade-offs). The server accepts
  only those two values; remembered on the device.
- A pasted job description gets an offer to run the Fit check on all of it.

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
  `ls projects ai`, `cat youbank`, `grep pytorch`, `diff youbank runway`, `top`, `cv fintech`, `tour`, `neofetch`, `open resume`,
  `fit …`, `ask …`).
- Terminal niceties: fish-style autosuggestions (→ accepts), history that
  persists on the device (`history -c` clears), and shareable runs:
  `/terminal?run=diff youbank runway` (read-only commands only), with
  `share` to copy one. Each case study links to `$ cat <slug>`; `help
<command>` shows examples; `/functions` lists every terminal command with
  a runnable example; `rain` and `bell` work here too.
- `/cv`: a web CV generated from the same content, print-ready.

### For recruiters

- **Fit check** (`FIT <GO>`, on `/cv`): paste a job description and see
  which requirements the site's own projects and roles back up, with links
  as evidence, and which it doesn't show. Only technical requirements are
  scored (startup experience and leadership are listed, not scored), and a
  score needs at least three, so a sales or nursing posting doesn't light up. A gauge sweeps to the score, and
  "Show what it recognised" marks each matched phrase in the posting. "Copy link"
  shares a result (`/cv#fit=…`) that carries the matched requirements, never
  the posting's text. Runs in the browser; nothing is
  sent. `fit <text>` does the same in the terminal, and `fit ask` hands the
  result to ayan-bot. Paste a job description into ayan-bot and it offers to
  hand the whole thing to the Fit check instead.
- **Tailor the CV** for a role (`/cv?for=fintech`, or `CVFN <GO>`, `CVAI`…): matching projects first,
  plus a few more that fit (they glide into place); Print / save as PDF and
  Copy as text keep it, and the footer names the version and its link.
- **Copy as text** on `/cv` (also served at `/cv.md`): the CV as Markdown
  for application forms and recruiter notes.
- **Role filter** on the projects section (AI, Fintech, Systems, Full-stack,
  Research).
- **`draft --to ayan`** in Contact writes a clear first email and opens it in
  your own mail app (or copies it).
- **Worth asking about** on every case study: questions built from the
  project's own facts ("how did recall@5 go from 0.85 to 0.97?") that open
  ayan-bot.
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

- `npm run test:smoke`: 82 browser checks against a production build (every
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
