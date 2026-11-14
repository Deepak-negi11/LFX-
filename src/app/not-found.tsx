import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { OrgLogo } from "@/components/org-logo";
import { getOrgSummaries } from "@/lib/data";

// Override the site-wide "index" default so every robots tag on this page says noindex.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function NotFound() {
  // Busy orgs with logos, to give people (and crawlers) somewhere useful to go.
  const popular = getOrgSummaries()
    .filter((o) => o.logoUrl)
    .slice(0, 6);
  // Bars under the 404: heights loosely like a "programs per year" chart.
  const bars = [38, 62, 46, 80, 54, 70, 30];

  return (
    <div className="relative isolate overflow-hidden">
      {/* Same small semicircle glow as the home page */}
      <div
        aria-hidden="true"
        className="animate-breathe pointer-events-none absolute left-1/2 top-0 -z-10 h-[260px] w-[min(640px,92%)] rounded-b-full bg-[radial-gradient(ellipse_at_top,rgb(122_192_250/0.42),transparent_72%)] dark:bg-[radial-gradient(ellipse_at_top,rgb(122_192_250/0.4),rgb(0_154_255/0.12)_45%,transparent_72%)]"
      />

      <div className="mx-auto max-w-3xl px-4 pb-24 pt-14 text-center sm:px-6 sm:pt-20">
        <p
          className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-[13px] font-medium text-muted backdrop-blur"
          style={delay(0)}
        >
          <span className="size-1.5 rounded-full bg-accent-fill" aria-hidden="true" />
          Error 404
        </p>

        {/* Big 404 sitting on a small bar chart */}
        <div className="animate-fade-up mt-6 flex flex-col items-center" style={delay(80)} aria-hidden="true">
          <span className="bg-gradient-to-b from-[#009AFF] to-[#7AC0FA] bg-clip-text pb-2 font-display text-[112px] font-extrabold leading-none tracking-[-0.06em] text-transparent sm:text-[168px]">
            404
          </span>
          <div className="mt-1 flex h-14 items-end gap-2">
            {bars.map((h, i) => (
              <span
                key={i}
                className="animate-grow-y w-5 rounded-t-md bg-gradient-to-t from-accent-fill to-sky opacity-80 sm:w-7"
                style={{ height: `${h}%`, ...delay(250 + i * 70) }}
              />
            ))}
          </div>
          <span className="h-px w-56 bg-line sm:w-72" />
        </div>

        <h1
          className="animate-fade-up mt-8 font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          style={delay(160)}
        >
          This page doesn&apos;t exist
        </h1>
        <p className="animate-fade-up mx-auto mt-3 max-w-[52ch] text-[17px] leading-relaxed text-muted" style={delay(220)}>
          The link may be old, or the organization was renamed. Search for it below.
        </p>

        {/* Real search: opens the explorer with ?q= filled in */}
        <Form
          action="/"
          className="animate-fade-up mx-auto mt-8 flex max-w-lg gap-2"
          style={delay(280)}
          role="search"
          aria-label="Search organizations"
        >
          <div className="relative flex-1">
            <MagnifyingGlass
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <label htmlFor="nf-search" className="sr-only">
              Organization, skill or topic
            </label>
            <input
              id="nf-search"
              name="q"
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search orgs or skills…"
              className="h-12 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-[15px] text-ink shadow-card transition-colors placeholder:text-muted hover:border-line-strong focus:border-sky focus:outline-none focus:ring-4 focus:ring-sky-soft"
            />
          </div>
          <button
            type="submit"
            className="h-12 shrink-0 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover active:scale-[0.98]"
          >
            Search
          </button>
        </Form>

        <section aria-labelledby="nf-popular" className="animate-fade-up mt-14 text-left" style={delay(340)}>
          <h2 id="nf-popular" className="text-center text-sm font-medium text-muted">
            Or jump to a popular organization
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3">
            {popular.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/org/${o.slug}/`}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-card transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong"
                >
                  <OrgLogo name={o.name} src={o.logoUrl} size={40} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink transition-colors group-hover:text-accent">
                      {o.name}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {o.foundation !== o.name ? `${o.foundation} · ` : ""}
                      {o.programCount} programs
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <nav
          aria-label="Helpful links"
          className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
          style={delay(400)}
        >
          <Link href="/" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
            Browse all organizations <ArrowRight size={14} weight="bold" aria-hidden="true" />
          </Link>
          <Link href="/?accepting=1" className="text-muted hover:text-ink">
            Open for applications
          </Link>
          <Link href="/about/" className="text-muted hover:text-ink">
            About
          </Link>
        </nav>
      </div>
    </div>
  );
}
