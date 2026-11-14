/**
 * Public address of the site, used for canonical links, the sitemap, share images and
 * structured data.
 *
 * Order: SITE_URL (set it for a custom domain) -> Vercel's production domain (provided
 * automatically during Vercel builds) -> localhost for local builds.
 */
const raw =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000";

export const SITE_URL = raw.replace(/\/+$/, "");

export const SITE_NAME = "LFX Orgs";

/** Absolute URL for a site path such as "/org/kubernetes/". */
export function absUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** JSON-LD for a <script type="application/ld+json">, with "<" escaped so it can't close the tag. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
