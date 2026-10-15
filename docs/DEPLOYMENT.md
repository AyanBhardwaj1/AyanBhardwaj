# Deployment

**Recommendation: deploy on Vercel (Hobby plan, free) at the default `*.vercel.app` URL.** A custom domain can be added later without changing any code (see [Custom domain (later)](#custom-domain-later)).

Vercel builds Next.js 16 with every feature this repo uses (`cacheComponents`, Partial Prefetching, `next/image` optimization, `next/font`, metadata routes) and needs no extra config. It also gives a preview deployment for every pull request and reads the security headers in [`vercel.json`](../vercel.json).

## Hosting options compared

|                    | **Vercel** (recommended)                                                           | GitHub Pages                                                                                                                                                                  | Cloudflare Pages / Workers                                                                                                                               | Netlify                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Cost for this site | Free (Hobby plan, personal and non-commercial use)                                 | Free for public repos                                                                                                                                                         | Free tier                                                                                                                                                | Free tier (usage-based credits)                                                         |
| Default URL        | `<project>.vercel.app`, for example `ayanbhardwaj.vercel.app` if that name is free | `ayanbhardwaj1.github.io/AyanBhardwaj` for this project repo (needs `basePath`). The root `ayanbhardwaj1.github.io` only works if the repo is named `AyanBhardwaj1.github.io` | `<project>.pages.dev` (or `<name>.<account>.workers.dev`)                                                                                                | `<site>.netlify.app`                                                                    |
| Next.js 16 support | Full, native. No config changes                                                    | Static export only (`output: 'export'`). No server, headers, proxy, ISR, image optimization or runtime caching                                                                | Static export on Pages, or full Next.js on Workers through the OpenNext adapter (`@opennextjs/cloudflare`), which adds config and lags new Next releases | Full Next.js through Netlify's adapter (OpenNext based). Newest features can lag Vercel |
| Preview per PR     | Yes, automatic, with a PR comment                                                  | No (one live site; previews need extra workflows)                                                                                                                             | Yes, per branch and PR                                                                                                                                   | Yes, "Deploy Previews" per PR                                                           |
| Security headers   | `vercel.json` (already in this repo)                                               | Not possible (only a `<meta>` CSP, which cannot set `frame-ancestors`)                                                                                                        | `_headers` file                                                                                                                                          | `netlify.toml` or `_headers`                                                            |
| Analytics          | Vercel Web Analytics and Speed Insights, built in, cookieless                      | None built in (add Plausible, Umami, GoatCounter, etc.)                                                                                                                       | Cloudflare Web Analytics, free and cookieless                                                                                                            | Netlify Analytics is a paid add-on                                                      |

Free-tier limits change often. Check each provider's pricing page before relying on a specific number.

Why Vercel wins here: it is the only option where the current `next.config.ts` works unchanged, previews work with no setup, and headers, analytics and a later custom domain are a few clicks each. GitHub Pages is the best fallback if the site ever has to live entirely on GitHub (see [Alternative: GitHub Pages](#alternative-github-pages-static-export)).

## Deploy to Vercel, step by step

### 1. Import the repository

1. Sign in at <https://vercel.com> with GitHub (the Hobby plan is free).
2. Go to **Add New... > Project** (or <https://vercel.com/new>).
3. Under **Import Git Repository**, choose GitHub. When asked to install the Vercel GitHub App, pick **Only select repositories** and choose `AyanBhardwaj1/AyanBhardwaj`.
4. Click **Import** next to the repository.

### 2. Configure the project

On the "Configure Project" screen:

| Setting               | Value                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| Project name          | `ayanbhardwaj` (this becomes `ayanbhardwaj.vercel.app`; pick another if taken) |
| Framework Preset      | **Next.js** (auto-detected)                                                    |
| Root Directory        | `./`                                                                           |
| Build Command         | leave the default (`next build`, which is what `npm run build` runs)           |
| Output Directory      | leave the default. Do not set it to `out`                                      |
| Install Command       | leave the default (Vercel uses `npm` because of `package-lock.json`)           |
| Environment Variables | none needed                                                                    |

Click **Deploy**. The first build takes about a minute.

### 3. Pin Node.js 22

The repo targets Node 22 (`.nvmrc`). After the first deploy:

1. **Project > Settings > Build and Deployment > Node.js Version**: choose **22.x** and save.
2. Be aware that `package.json` has `"engines": { "node": ">=22" }`, and Vercel gives `engines` priority over the dashboard setting. An open-ended range like `>=22` lets Vercel pick a newer major (and it prints a warning in the build log). To pin it, change the field to `"node": "22.x"` in a future PR. This was left alone here to avoid merge conflicts with the site branch.

### 4. Production and preview deployments

- **Production branch:** `main`. Check under **Settings > Environments > Production** (Branch Tracking). Every merge to `main` deploys to `ayanbhardwaj.vercel.app`.
- **Preview deployments:** every push to any other branch, and every PR, gets its own URL (`ayanbhardwaj-git-<branch>-<team>.vercel.app`). The Vercel bot comments the link on the PR.
- Preview URLs automatically send `X-Robots-Tag: noindex`, so they do not compete with production in search results.
- **Deployment Protection:** by default (Standard Protection) previews require a Vercel login, while production is public. That is fine for a solo project. Turn it off under **Settings > Deployment Protection** only if you want to share preview links with people who don't have Vercel accounts.
- **Rollback:** in **Deployments**, open any earlier production deployment and use **Instant Rollback**.

### 5. Security headers

[`vercel.json`](../vercel.json) adds these headers to every response:

| Header                                             | Value / purpose                                                                                                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`                          | Same-origin scripts, styles, fonts, frames and connections. `'unsafe-inline'` for scripts and styles (see below). `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests` |
| `X-Frame-Options: DENY`                            | Legacy clickjacking protection (matches `frame-ancestors 'none'`)                                                                                                                                                                     |
| `Strict-Transport-Security`                        | HTTPS only for 2 years                                                                                                                                                                                                                |
| `X-Content-Type-Options: nosniff`                  | No MIME sniffing                                                                                                                                                                                                                      |
| `Referrer-Policy: strict-origin-when-cross-origin` | Sends only the origin to other sites                                                                                                                                                                                                  |
| `Permissions-Policy`                               | Turns off camera, microphone, geolocation, payment, USB and Topics                                                                                                                                                                    |
| `Cross-Origin-Opener-Policy: same-origin`          | Isolates the window from cross-origin popups                                                                                                                                                                                          |

**Why `'unsafe-inline'` and no nonces.** Next.js puts inline bootstrap scripts (`self.__next_f.push(...)`) in every page. A nonce-based CSP would remove the need for `'unsafe-inline'`, but nonces must be generated per request in `proxy.ts`, which forces every page to render dynamically. The Next 16 docs say this is incompatible with Partial Prerendering and `cacheComponents`, both of which this repo uses. The site has no user input, logins or third-party scripts, so a same-origin policy with `'unsafe-inline'` is the practical choice. A stricter route later is Next's experimental SRI (`experimental.sri`), which allows a hash-based policy while staying static.

**Resume PDF (`/Ayan_Bhardwaj_Resume.pdf`).** PDFs match a separate rule. They get no script or `default-src` restrictions (so Chrome, Firefox and Safari can open them in their built-in viewers in a new tab), `Content-Disposition: inline` (open instead of download), and `frame-ancestors 'self'` with `X-Frame-Options: SAMEORIGIN`. That lets the site embed the PDF in an `<iframe>` on its own pages if needed, while other sites still can't frame it. The site CSP has `object-src 'none'`, so embed the PDF with `<iframe>` or a plain link, not `<object>`/`<embed>`. Link to it with `target="_blank" rel="noopener noreferrer"`.

**When to change the CSP:**

- Images from another host (for example GitHub avatars via a plain `<img>`): add the host to `img-src`. `https://avatars.githubusercontent.com` is already allowed. Images served through `next/image` come from `/_next/image` (same origin), so they need nothing.
- Fetching data in the browser (for example `api.github.com` from a Client Component): add the host to `connect-src`. Fetching on the server or at build time needs no change.
- A contact form posting to a service (Formspree, etc.): add it to `form-action`.
- Third-party embeds (YouTube, Calendly): add them to `frame-src`.
- **Vercel Toolbar** on preview deployments loads from `https://vercel.live` and is blocked by this CSP. Either turn the toolbar off for the project (the "Vercel Toolbar" setting in project settings) or add `https://vercel.live` to `script-src`, `connect-src`, `img-src`, `style-src`, `font-src` and `frame-src`.

The headers only apply on Vercel. They do not apply to `next dev` or `next start`. Check them on a preview with:

```bash
curl -sI https://<preview-or-production-url>/ | grep -iE "content-security|strict-transport|x-frame|referrer|permissions|nosniff"
curl -sI https://<url>/Ayan_Bhardwaj_Resume.pdf | grep -iE "content-type|content-disposition|content-security"
```

Then open the page with DevTools > Console and confirm there are no CSP violation errors. You can also run the URL through <https://securityheaders.com>.

If the builder ever prefers headers in `next.config.ts` instead, the same values can move into an `async headers()` function. Keep them in one place only, because if both are defined, the same header gets set twice.

### 6. Analytics (optional, all cookieless)

Both Vercel products are privacy-friendly, need no cookie banner, and are served from the site's own origin (`/_vercel/...`), so the CSP above already allows them.

- **Web Analytics** (page views, referrers, countries): **Project > Analytics > Enable**, then
  ```bash
  npm i @vercel/analytics
  ```
  and render `<Analytics />` from `@vercel/analytics/next` in `src/app/layout.tsx`.
- **Speed Insights** (real-user Core Web Vitals): **Project > Speed Insights > Enable**, then
  ```bash
  npm i @vercel/speed-insights
  ```
  and render `<SpeedInsights />` from `@vercel/speed-insights/next` in the root layout.

The Hobby plan includes a monthly free allowance for both. Alternatives: Cloudflare Web Analytics (free), Plausible (paid, hosted) or Umami (self-host). Each third-party option needs its script and endpoint hosts added to `script-src` and `connect-src`.

### 7. Custom domain (later)

Not needed for launch. When you're ready:

1. Buy the domain from any registrar (Cloudflare Registrar, Porkbun, Namecheap) or directly in Vercel.
2. **Project > Settings > Domains > Add**, enter `ayanbhardwaj.com` (example), and also add `www.ayanbhardwaj.com` set to redirect to the apex (or the other way around; pick one canonical host).
3. At the registrar, create the DNS records Vercel shows. They are usually:
   - apex (`@`): an `A` record to the IP Vercel lists (historically `76.76.21.21`)
   - `www`: a `CNAME` to the target Vercel lists (historically `cname.vercel-dns.com`)

   Always copy the exact values from the Vercel dashboard, because they can be project-specific. Or switch the domain's nameservers to Vercel DNS (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`).

4. Wait for DNS to propagate (minutes to a few hours). Vercel issues the HTTPS certificate automatically.
5. Update `metadataBase`, the sitemap and `robots.txt` to the new domain (or derive them from `VERCEL_PROJECT_PRODUCTION_URL`, see below), then re-submit the sitemap in Google Search Console.

**Tip for the builder:** set `metadataBase` from Vercel's system environment variable so OG image and canonical URLs follow the production host automatically:

```ts
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
};
```

## Alternative: GitHub Pages (static export)

Works, but with real trade-offs for this stack.

**Required changes:**

1. In `next.config.ts`:
   ```ts
   const nextConfig: NextConfig = {
     output: "export",
     basePath: "/AyanBhardwaj", // project site lives under the repo name
     images: { unoptimized: true }, // or a custom loader
     trailingSlash: true, // folder/index.html URLs work best on Pages
     // ...existing options
   };
   ```
   `basePath` can be dropped only if the repo is renamed to `AyanBhardwaj1.github.io` or a custom domain is used.
2. Every route must be prerenderable at build time: no `cookies()`/`headers()`, no `connection()`, no request-dependent Route Handlers, no Server Actions, no `proxy.ts`, and dynamic routes need `generateStaticParams()`. With `cacheComponents` on, anything left uncached or dynamic either fails the export or is frozen at build time. Check the build output carefully.
3. Add a workflow that runs `npm run build`, adds an empty `out/.nojekyll` file, and publishes `out/` with `actions/upload-pages-artifact` + `actions/deploy-pages` (needs `pages: write` and `id-token: write` permissions). In **Settings > Pages**, set Source to **GitHub Actions**.
4. Hard-coded asset paths (for example `/Ayan_Bhardwaj_Resume.pdf`) must include the `basePath`. `next/link` and `next/image` add it automatically, but plain `<a href>` and `<img src>` do not.

**What you lose compared with Vercel:**

- Security headers (CSP `frame-ancestors`, HSTS settings, Permissions-Policy), since Pages can't set response headers
- `next/image` optimization (images ship at full size unless a loader service is used)
- Preview deployments per PR
- ISR and time-based revalidation (GitHub data only updates on rebuild, for example with a scheduled workflow)
- Built-in analytics
- Custom 404 works (`404.html` is generated), but redirects and rewrites do not

## Pre-launch checklist

Content and privacy

- [ ] No phone number anywhere: page text, metadata, JSON-LD, `vCard`, or **inside the resume PDF**
- [ ] No graduation date anywhere, including the resume PDF and alt text
- [ ] Resume PDF metadata cleaned (File > Properties: author, title, no tracking info). Try `exiftool Ayan_Bhardwaj_Resume.pdf`
- [ ] Email shown is the one you want public. Consider a `mailto:` link rather than plain text to reduce scraping
- [ ] Spelling and grammar pass. All links point to the right profiles

SEO and sharing

- [ ] `<title>` and `description` set in root `metadata` (not "Create Next App")
- [ ] `metadataBase` set so OG URLs are absolute
- [ ] Open Graph image: `src/app/opengraph-image.(png|tsx)`, 1200x630. Test with <https://www.opengraph.xyz> and the LinkedIn Post Inspector
- [ ] Favicon and app icons: `src/app/icon.(png|svg)`, `apple-icon.png`. Replace the default `favicon.ico`
- [ ] `src/app/sitemap.ts` and `src/app/robots.ts` exist and point to the production URL
- [ ] JSON-LD `Person` schema on the home page (see [LAUNCH-IDEAS.md](./LAUNCH-IDEAS.md))
- [ ] `lang="en"` on `<html>`

Pages and behavior

- [ ] Custom 404 page (`src/app/not-found.tsx`) that links home
- [ ] Resume opens in a new tab from the site and directly at `/Ayan_Bhardwaj_Resume.pdf`
- [ ] Works with JavaScript disabled for core content (prerendered HTML)
- [ ] Respects `prefers-reduced-motion` (Motion animations can be reduced via `useReducedMotion` / `MotionConfig reducedMotion="user"`)
- [ ] Looks right at 320px, 768px and 1440px widths, and in dark mode if supported

Security

- [ ] Headers present on the preview (see `curl` commands above), no CSP errors in the console
- [ ] No secrets in the repo (`git log -p | grep -iE "token|secret|key"`), no `.env` committed
- [ ] External links use `rel="noopener noreferrer"`

Performance and accessibility

- [ ] Lighthouse (CI job, or Chrome DevTools on the preview): Performance, Accessibility, Best Practices and SEO at 0.9 or higher, on mobile
- [ ] Images through `next/image` with sizes set; fonts through `next/font`
- [ ] Keyboard-only walk-through: visible focus, logical tab order, skip link if the nav is long
- [ ] Color contrast at WCAG AA (axe DevTools or the Lighthouse a11y audit)
- [ ] Meaningful `alt` text; decorative images have `alt=""`
- [ ] One `<h1>` per page, headings in order

Links

- [ ] Broken-link check on the preview, for example:
  ```bash
  npx --yes linkinator https://<preview-url> --recurse --skip "linkedin.com"
  ```
  (LinkedIn blocks bots, so check those links by hand.)

Launch

- [ ] `main` deploys green on Vercel; the production URL loads over HTTPS
- [ ] Submit the sitemap in Google Search Console (see [LAUNCH-IDEAS.md](./LAUNCH-IDEAS.md))
- [ ] Add the URL to the GitHub repo "About" box, LinkedIn and resume
