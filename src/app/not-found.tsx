import type { Metadata } from "next";
import Link from "next/link";
import { getOrgSummaries } from "@/lib/data";

// Override the site-wide "index" default so every robots tag on this page says noindex.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  // A few busy orgs to keep people (and crawlers) moving.
  const popular = getOrgSummaries().slice(0, 8);
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-20 text-center sm:px-6">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
      <p className="mx-auto mt-3 max-w-[48ch] text-muted">
        The organization may have been renamed, or the link is wrong. Search all organizations, or try a popular one.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover"
      >
        Browse all organizations
      </Link>
      <ul className="mt-10 flex flex-wrap justify-center gap-2">
        {popular.map((o) => (
          <li key={o.slug}>
            <Link
              href={`/org/${o.slug}/`}
              className="block rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              {o.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
