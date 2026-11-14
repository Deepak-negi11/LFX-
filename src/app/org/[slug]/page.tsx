import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { OrgLogo } from "@/components/org-logo";
import { YearStack } from "@/components/year-stack";
import { PaidTag } from "@/components/open-now";
import { formatDate, getOrg, getSite } from "@/lib/data";
import { absUrl, jsonLd, SITE_NAME } from "@/lib/site";
import type { Program } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return getSite().orgs.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: PageProps<"/org/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const org = getOrg(slug);
  if (!org) return {};
  const span = yearSpan(org.years);
  const title = `${org.name} LFX Mentorship projects (${span})`;
  const skills = org.skills.slice(0, 4).join(", ");
  const description = `${org.programCount} LFX Mentorship program${org.programCount === 1 ? "" : "s"} from ${org.name} (${org.foundation}), ${span}: ${org.paidCount} paid, ${org.menteeCount} mentees selected.${skills ? ` Skills: ${skills}.` : ""} Past projects by year.`;
  const path = `/org/${org.slug}/`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title, description, siteName: SITE_NAME },
    twitter: { card: "summary_large_image", title, description },
  };
}

function yearSpan(years: number[]) {
  if (years.length === 0) return "all years";
  return years.length > 1 ? `${years[0]} to ${years.at(-1)}` : String(years[0]);
}

const STATUS_LABEL: Record<string, string> = {
  acceptance: "Accepting applications",
  "in-progress": "In progress",
  completed: "Completed",
};

export default async function OrgPage({ params }: PageProps<"/org/[slug]">) {
  const { slug } = await params;
  const org = getOrg(slug);
  if (!org) notFound();

  // Each program is listed under the latest year it ran in.
  const byYear = new Map<number, Program[]>();
  for (const p of org.programs) {
    const y = p.years.at(-1) ?? 0;
    byYear.set(y, [...(byYear.get(y) ?? []), p]);
  }
  const yearsDesc = [...byYear.keys()].sort((a, b) => b - a);
  const repo = org.programs.find((p) => p.repoUrl?.includes("github.com"))?.repoUrl;
  const topSkills = org.skills.slice(0, 5);
  // Plain-language summary: useful for readers and for search engines.
  const summary = `${org.name} (${org.foundation}) has run ${org.programCount} LFX Mentorship program${
    org.programCount === 1 ? "" : "s"
  } across ${org.years.length} year${org.years.length === 1 ? "" : "s"} (${org.years.join(", ")}). ${org.paidCount} ${
    org.paidCount === 1 ? "was" : "were"
  } paid and ${org.menteeCount} mentee${org.menteeCount === 1 ? " was" : "s were"} selected.${
    topSkills.length ? ` Most asked-for skills: ${topSkills.join(", ")}.` : ""
  }`;
  const repoHome = repo?.match(/^https:\/\/github\.com\/[^/]+(?:\/[^/#?]+)?/)?.[0];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} aria-hidden="true" />
        All organizations
      </Link>

      <header className="animate-fade-up mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
        <OrgLogo name={org.name} src={org.logoUrl} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]" translate="no">
              {org.name}
            </h1>
            {org.accepting && (
              <span className="rounded-md bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">Accepting now</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">{org.foundationFull}</p>
          {repoHome && (
            <a
              href={repoHome}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent underline-offset-4 hover:underline"
            >
              <GithubLogo size={16} aria-hidden="true" />
              {repoHome.replace("https://github.com/", "")}
            </a>
          )}
        </div>
      </header>

      <p className="animate-fade-up mt-6 max-w-[70ch] leading-relaxed text-muted" style={{ "--d": "40ms" } as CSSProperties}>
        {summary}
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd([
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Organizations", item: absUrl("/") },
              { "@type": "ListItem", position: 2, name: org.name, item: absUrl(`/org/${org.slug}/`) },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${org.name} LFX Mentorship programs`,
            numberOfItems: org.programCount,
            itemListElement: org.programs.slice(0, 100).map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: p.title,
              url: p.url,
            })),
          },
        ])}
      />

      <dl
        className="animate-fade-up mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4"
        style={{ "--d": "60ms" } as CSSProperties}
      >
        <Stat label="Programs" value={org.programCount} />
        <Stat label="Paid programs" value={org.paidCount} />
        <Stat label="Mentees selected" value={org.menteeCount} />
        <Stat
          label="Years active"
          value={org.years.length > 1 ? `${org.years[0]} to ${org.years.at(-1)}` : String(org.years[0] ?? "Unknown")}
          small
        />
      </dl>

      <section aria-labelledby="per-year" className="animate-fade-up mt-10" style={{ "--d": "120ms" } as CSSProperties}>
        <h2 id="per-year" className="text-lg font-semibold tracking-tight">
          Year by year
        </h2>
        <p className="mt-1 text-sm text-muted">Hover a year to see what happened. Click it to jump to that year.</p>
        <div className="mt-4">
          <YearStack years={org.years} programs={org.programs} />
        </div>
      </section>

      {org.skills.length > 0 && (
        <section aria-labelledby="skills" className="mt-10">
          <h2 id="skills" className="text-lg font-semibold tracking-tight">
            Skills they ask for
          </h2>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {org.skills.map((s) => (
              <li key={s}>
                <Link
                  href={`/?skills=${encodeURIComponent(s)}`}
                  className="block rounded-md border border-line bg-surface-2 px-2.5 py-1 text-sm text-muted transition-colors hover:border-accent-fill hover:text-accent"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="programs" className="mt-12">
        <h2 id="programs" className="text-lg font-semibold tracking-tight">
          All programs
        </h2>
        <nav aria-label="Jump to year" className="mt-3 flex flex-wrap gap-1.5">
          {yearsDesc.map((y) => (
            <a
              key={y}
              href={`#y${y}`}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium tabular-nums text-muted transition-colors hover:border-accent-fill hover:text-accent"
            >
              {y || "Unknown"}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-12">
          {yearsDesc.map((y) => (
            <section key={y} id={`y${y}`} aria-labelledby={`h${y}`} className="scroll-mt-20">
              <h3 id={`h${y}`} className="flex items-baseline gap-2 border-b border-line pb-2">
                <span className="font-display text-2xl font-semibold tabular-nums tracking-tight">{y || "Unknown year"}</span>
                <span className="text-sm text-muted">
                  {byYear.get(y)!.length} program{byYear.get(y)!.length === 1 ? "" : "s"}
                </span>
              </h3>
              <ul className="mt-4 grid grid-cols-1 gap-4">
                {byYear.get(y)!.map((p) => (
                  <ProgramItem key={p.id} p={p} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div className="bg-surface px-4 py-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-1 font-display font-semibold tabular-nums tracking-tight ${small ? "text-xl" : "text-[28px] leading-none"}`}>{value}</dd>
    </div>
  );
}

function ProgramItem({ p }: { p: Program }) {
  const termNames = [...new Set(p.terms.map((t) => t.name))];
  // LFX keeps some running terms marked "open", so only trust the deadline while the program is accepting.
  const open = p.status === "acceptance" ? p.terms.find((t) => t.status === "open" && t.appsClose) : undefined;
  return (
    <li className="min-w-0 rounded-xl border border-line bg-surface p-5 shadow-card [overflow-wrap:anywhere] transition-transform duration-300 hover:-translate-y-0.5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <a
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 text-[17px] font-semibold leading-snug hover:text-accent"
        >
          {p.title}
          <ArrowUpRight size={14} className="ml-1 inline align-baseline" aria-hidden="true" />
          <span className="sr-only"> (opens on LFX)</span>
        </a>
        <div className="flex flex-wrap items-center gap-1.5">
          <PaidTag paid={p.paid} amountUsd={p.amountUsd} />
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
              p.status === "acceptance"
                ? "bg-ok-soft text-ok"
                : p.status === "in-progress"
                  ? "bg-warn-soft text-warn"
                  : "bg-surface-2 font-medium text-muted"
            }`}
          >
            {STATUS_LABEL[p.status] ?? p.status}
          </span>
        </div>
      </div>

      <p className="mt-1 text-xs text-muted">
        {termNames.join(", ")}
        {open?.appsClose && (
          <>
            {" · "}
            Applications close <time dateTime={open.appsClose}>{formatDate(open.appsClose)}</time>
          </>
        )}
      </p>

      {p.description && <p className="mt-3 text-sm leading-relaxed text-muted">{p.description}</p>}

      {p.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1" aria-label="Skills">
          {p.skills.slice(0, 10).map((s) => (
            <li key={s} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
              {s}
            </li>
          ))}
        </ul>
      )}

      {(p.mentors.length > 0 || p.mentees.length > 0) && (
        <dl className="mt-4 grid gap-3 border-t border-line pt-3 text-sm sm:grid-cols-2">
          {p.mentors.length > 0 && (
            <div>
              <dt className="text-xs text-muted">Mentors</dt>
              <dd className="mt-0.5">{p.mentors.join(", ")}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted">Selected mentees</dt>
            <dd className="mt-0.5">
              {p.mentees.length ? (
                <ul>
                  {p.mentees.map((m, i) => (
                    <li key={`${m.name}-${i}`}>
                      {m.name}
                      {m.term && <span className="text-muted"> ({m.term})</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted">None listed</span>
              )}
            </dd>
          </div>
        </dl>
      )}
    </li>
  );
}
