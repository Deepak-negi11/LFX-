# LFX Orgs

An unofficial explorer for [LFX Mentorship](https://mentorship.linuxfoundation.org/). The official site lists
programs one by one. This site groups them by organization, so you can see:

- which orgs took part in which years (2020 onward)
- every past project of an org, with skills, mentors and selected mentees
- which programs were paid (from the sponsors listed on LFX)
- which programs are accepting applications right now, with deadlines

Filters (year, "came every selected year", foundation, skills, paid only, accepting now) are saved in the URL,
so a filtered view can be shared as a link.

Not affiliated with the Linux Foundation.

## How it works

```
LFX public API ──> scripts/crawl.mjs ──> data/raw/*.json ──> scripts/build-data.mjs ──> src/data/site.json ──> next build ──> out/
```

1. `scripts/crawl.mjs` reads every program from the API the LFX site itself uses
   (`/api/programs`, plus `/mentees` and `/sponsors` per program). It runs 4 requests at a time with a pause
   between them. Finished programs that haven't changed are reused from the last crawl, so a daily run takes
   about 2 minutes.
2. `scripts/build-data.mjs` groups programs into orgs. CNCF and LF Decentralized Trust programs are grouped by
   project name (from the title, a known-project list, or the GitHub repo), and other foundations are one org each.
   It also works out paid status: paid if a sponsor gave money, unpaid if not or if the title says unpaid.
3. Next.js builds a fully static site (one page per org) into `out/`.

## Run it locally

```bash
bun install
bun run update   # crawl LFX + build site data (first full crawl takes ~6 minutes)
bun run dev      # http://localhost:3000 (or the next free port)
bun run build    # static site in out/
```

`src/data/site.json` is committed, so `bun run dev` works without crawling first.

## Deploy on Vercel

1. On [vercel.com](https://vercel.com), choose **Add New → Project** and import this GitHub repo.
2. Keep the detected settings (Next.js, `bun install`, `next build`) and deploy.
3. Optional, for a custom domain: add it in Vercel, then set the environment variable `SITE_URL`
   (for example `https://lfxorgs.dev`). Without it, links in the sitemap and share images use Vercel's
   production domain automatically (`VERCEL_PROJECT_PRODUCTION_URL`).

`vercel.json` makes Vercel serve the generated share images (`/opengraph-image`, `/org/<slug>/opengraph-image`)
as `image/png`.

The site is a plain static export (`out/`), so any static host works too. For a sub-path such as GitHub Pages
project sites, build with `BASE_PATH=/repo-name SITE_URL=https://user.github.io/repo-name`.

## Daily data update

`.github/workflows/update.yml` runs every day at 02:30 UTC (or by hand from the **Actions** tab):

1. crawls LFX and rebuilds `src/data/site.json`
2. builds the site, so broken data is never committed
3. commits `src/data/site.json` as `chore(data): update LFX Mentorship data` (author `github-actions[bot]`),
   **only if the data really changed** (timestamps alone don't count; see `scripts/data-changed.mjs`)

Vercel redeploys on every commit, so new programs show up the day after LFX lists them.

### Keep-alive (no editing needed between seasons)

GitHub pauses scheduled workflows in a repo with no commits for 60 days. Data commits usually prevent that, and a
small `keepalive` job also re-enables the workflow through the GitHub API on every scheduled run (no commits), so
quiet months between LFX seasons are covered too.

If `main` is protected so bots can't push, allow `github-actions[bot]` to push, or the data commit step fails.

### Notes

- The LFX API is not documented and can change. If the crawl fails, the workflow fails (GitHub emails you)
  and the site keeps the last good data.
- New CNCF projects are grouped automatically from titles like `CNCF - Project: ...`. A new LF Decentralized
  Trust project whose title and repo don't name it lands in "(other projects)" until you add its name to
  `KNOWN_PROJECTS` in `scripts/build-data.mjs`.

## SEO

- Titles, descriptions and canonical links for every page, built from the real numbers (org pages:
  "Kubernetes LFX Mentorship projects (2020 to 2026)").
- Share images (Open Graph / X cards) for the home page and every org, generated at build time with the site fonts.
- `sitemap.xml` (home, about, every org with its last-change date), `robots.txt`, web manifest.
- Structured data: `WebSite` with a search action (`/?q=`), and `BreadcrumbList` + `ItemList` of programs on
  org pages.
- Static HTML: every org card and page is in the HTML, so search engines see it without running JavaScript.

After the first deploy, add the site in [Google Search Console](https://search.google.com/search-console) and
submit `https://<your-domain>/sitemap.xml`.

## Known gaps

- Some LF Decentralized Trust 2025 programs are missing from LFX itself, so they're missing here too.
- A few programs can't be matched to a project and sit under "(other projects)".
- The paid amount is the total sponsorship of a program, not one mentee's stipend.

## Privacy

Only mentee names and terms (already public on LFX) are shown. No photos, intros or contact details are stored
in the site data. Removal requests: open an issue.
