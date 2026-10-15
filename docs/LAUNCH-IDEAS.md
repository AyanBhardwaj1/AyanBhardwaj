# Launch ideas

Post-launch ideas, roughly ordered by value for effort. None of this blocks launch. The site goes live at `*.vercel.app` first.

## 1. Get indexed (week 1)

- **Google Search Console**: add a **URL-prefix** property for the production URL (for example `https://ayanbhardwaj.vercel.app`). On a `vercel.app` URL you can't add DNS records, so verify with the HTML meta tag: put the code in `metadata.verification.google` in the root layout, deploy, then click Verify. Submit `/sitemap.xml`. After moving to a custom domain, add a **Domain** property (DNS TXT verification) and submit again.
- **Bing Webmaster Tools**: import the property straight from Search Console. Bing also powers DuckDuckGo and several AI search tools.
- Use **URL Inspection > Request indexing** in Search Console for the home page instead of waiting.
- Check that `robots.ts` allows everything and that previews stay `noindex` (Vercel handles this automatically).
- Search for your name in a private window a couple of weeks later and see what ranks.

## 2. Structured data: JSON-LD `Person`

Helps Google connect the site, GitHub and LinkedIn as the same person (knowledge panel, rich results). Render it in `src/app/page.tsx` as the Next 16 docs recommend, escaping `<`:

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ayan Bhardwaj",
  url: "https://ayanbhardwaj.vercel.app",
  image: "https://ayanbhardwaj.vercel.app/<headshot>.jpg",
  jobTitle: "<e.g. Software Engineer>",
  sameAs: [
    "https://github.com/AyanBhardwaj1",
    "https://www.linkedin.com/in/<handle>",
  ],
  // alumniOf / affiliation: { "@type": "CollegeOrUniversity", name: "<school>" },
  // Don't add telephone, birthDate or graduation dates (privacy).
};

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
  }}
/>;
```

`type="application/ld+json"` blocks aren't executed, so the CSP doesn't affect them. Validate with <https://search.google.com/test/rich-results> and <https://validator.schema.org>.

## 3. Sharing on LinkedIn

- Before posting, paste the URL into the **LinkedIn Post Inspector** (<https://www.linkedin.com/post-inspector/>). It shows the preview card and refreshes LinkedIn's cache of the OG image and title. Re-run it whenever the OG image changes.
- Put the URL in three places: **Contact info > Website** (choose "Portfolio"), the **Featured** section (as a link, so it shows the OG card), and the headline or About section.
- Post format that tends to work: 2-3 sentences on what you built and one interesting technical detail (for example the GitHub-powered project section), a screenshot or a short screen recording (native video gets more reach than a link card), and the link in the post itself.
- Add the URL to the GitHub profile (Settings > Public profile > Website), this repo's **About** box, your resume header, and your email signature.

## 4. Analytics

- Turn on **Vercel Web Analytics** and **Speed Insights** (steps in [DEPLOYMENT.md](./DEPLOYMENT.md#6-analytics-optional-all-cookieless)). Both are cookieless, so no banner is needed.
- Useful questions: which referrers bring visitors (LinkedIn, GitHub, applications)? Do people click the resume? Track a custom event on the resume link and project links with `track()` from `@vercel/analytics` (custom events may need a paid plan; page views of the PDF URL itself are a free proxy).
- Alternatives if you leave Vercel: Cloudflare Web Analytics (free), GoatCounter (free for personal use), Plausible or Umami.

## 5. Keep GitHub data fresh

If the site shows repos, stars or recent activity from the GitHub API:

**Preferred: let Next revalidate on its own.** With `cacheComponents` on, wrap the fetch in a `"use cache"` function with `cacheLife("hours")` (or `"days"`). Vercel serves the cached result and refreshes it in the background, with no rebuilds and no workflow. Read `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` before writing it.

**Fallback: scheduled rebuild with a Vercel Deploy Hook** (works for any build-time data):

1. Vercel: **Project > Settings > Git > Deploy Hooks**. Create a hook named `daily-refresh` for branch `main` and copy the URL.
2. GitHub: **Settings > Secrets and variables > Actions > New repository secret** named `VERCEL_DEPLOY_HOOK_URL`.
3. Add `.github/workflows/refresh.yml`:

```yaml
name: Refresh site data

on:
  schedule:
    - cron: "17 9 * * *" # daily, 09:17 UTC (off the hour to avoid queue spikes)
  workflow_dispatch:

permissions: {}

jobs:
  redeploy:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Trigger Vercel production rebuild
        run: curl -fsS -X POST "$HOOK" > /dev/null
        env:
          HOOK: ${{ secrets.VERCEL_DEPLOY_HOOK_URL }}
```

Notes:

- GitHub disables scheduled workflows in public repos after 60 days without commits. Re-enable it from the Actions tab, or keep the repo active.
- Unauthenticated GitHub API calls are limited to 60 an hour per IP, and Vercel build machines share IPs. Create a **fine-grained personal access token** with public-repo read-only access, add it in Vercel as `GITHUB_TOKEN` (Production + Preview), and send it as `Authorization: Bearer ...` on server-side fetches only. Never expose it with a `NEXT_PUBLIC_` prefix.

## 6. Dynamic OG images

Replace a static `opengraph-image.png` with `src/app/opengraph-image.tsx` using `ImageResponse` from `next/og`. That gives a generated 1200x630 card with your name, role and a short tagline in the site's fonts and colors. Per-route versions (for example `/projects/[slug]/opengraph-image.tsx`) give each project page its own card. Check the result in the LinkedIn Post Inspector and <https://www.opengraph.xyz>.

## 7. Custom domain ideas (no rush)

Availability isn't checked here. Search at a registrar.

- `ayanbhardwaj.com`: the most universal and recruiter-friendly choice
- `ayanbhardwaj.dev`: developer-signalling. `.dev` is HTTPS-only (HSTS-preloaded TLD), which Vercel handles
- `ayanbhardwaj.me`, `ayanbhardwaj.io`, `ayanbhardwaj.tech`
- Shorter: `ayanb.dev`, `ayan.codes`, `bhardwaj.dev`
- If you're a student, the **GitHub Student Developer Pack** has included free first-year domain offers (for example `.me` or `.tech`). Check before buying.

Tips: buy from a registrar with at-cost renewals and free WHOIS privacy (Cloudflare Registrar, Porkbun). Set the renewal to auto. Check the renewal price, not just the first-year price. Keep `*.vercel.app` working; Vercel redirects it to the custom domain once one is set as primary.

## 8. Uptime monitoring

- **UptimeRobot** or **Better Stack** free tiers: 5-minute HTTP checks on `/` and `/Ayan_Bhardwaj_Resume.pdf`, alerting by email or push.
- Or **Upptime** (GitHub Actions based, open source), which also gives a public status page on GitHub Pages.
- Vercel itself rarely goes down. The realistic failures are a bad deploy (use Instant Rollback) or a broken resume link after renaming the PDF, so monitoring the PDF URL is the useful part.

## 9. GitHub profile README

This repo is `AyanBhardwaj1/AyanBhardwaj`, which is **not** the special profile repo. A profile README needs a public repo named exactly **`AyanBhardwaj1/AyanBhardwaj1`** with a `README.md`. Ideas for it:

- One-line intro and a link to the site (the main call to action)
- 3-4 pinned highlights with one line each (or use GitHub's pinned repos and keep the README short)
- Tech you work with as plain text or small badges (avoid walls of badges)
- Optional: auto-updating "latest activity" with a scheduled workflow, or stats cards (they are slow third-party images; use sparingly)

Also pin this repo and add a description and website link to its About box.

## 10. Smaller polish items

- **Lighthouse budgets**: once scores are stable at 0.9 or higher, make the Lighthouse job blocking (remove `continue-on-error` in `.github/workflows/ci.yml`) and add more URLs to `lighthouserc.json`.
- **Broken-link check** in CI: run `linkinator` against the Vercel preview (via the `deployment_status` event) or on a weekly schedule.
- **`security.txt`** at `public/.well-known/security.txt` with a contact email.
- **View Transitions** between pages (Next 16 supports the View Transitions API; see `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`).
- **`/uses` or `/now` page**: popular on dev portfolios and an easy reason to revisit the site.
- **Print stylesheet** so the site prints cleanly as a fallback resume.
- **Pin the Node version** for Vercel: change `"engines"` in `package.json` to `"node": "22.x"`.
- **Stricter CSP later**: try `experimental.sri` (hash-based) to drop `'unsafe-inline'` from `script-src` without giving up static rendering.
