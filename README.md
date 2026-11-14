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

## Daily auto-update (GitHub Pages)

`.github/workflows/update.yml` runs every day at 02:30 UTC (and on every push to `main`, or by hand from the Actions tab).
It crawls LFX, rebuilds the data and deploys the site to GitHub Pages. New programs appear the day after LFX lists them.

To turn it on:

1. Push this repo to GitHub.
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Run the workflow once from the **Actions** tab.

### Keep-alive (no editing needed between seasons)

GitHub pauses scheduled workflows in a repo with no commits for 60 days. The workflow guards against that in two ways:

1. **Every daily run**, a small `keepalive` job re-enables the workflow through the GitHub API. No commits.
2. **On the 1st of each month**, the build job commits the fresh `src/data/site.json` as
   `chore(data): monthly LFX data snapshot` (author: `github-actions[bot]`). At most 12 commits a year, and you get
   a monthly history of the data. This commit does not trigger another run.

If your `main` branch is protected so that bots can't push, the monthly snapshot step fails. Either allow
`github-actions[bot]` to push or remove that step; the API keep-alive still runs.

### Notes

- The LFX API is not documented and can change. If the crawl fails, the workflow fails (GitHub emails you)
  and the last good deploy stays online.
- New CNCF projects are grouped automatically from titles like `CNCF - Project: ...`. A new LF Decentralized
  Trust project whose title and repo don't name it lands in "(other projects)" until you add its name to
  `KNOWN_PROJECTS` in `scripts/build-data.mjs`.

## Known gaps

- Some LF Decentralized Trust 2025 programs are missing from LFX itself, so they're missing here too.
- A few programs can't be matched to a project and sit under "(other projects)".
- The paid amount is the total sponsorship of a program, not one mentee's stipend.

## Privacy

Only mentee names and terms (already public on LFX) are shown. No photos, intros or contact details are stored
in the site data. Removal requests: open an issue.
