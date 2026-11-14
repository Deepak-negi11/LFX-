import type { CSSProperties } from "react";
import { CountUp } from "@/components/count-up";
import { Explorer } from "@/components/explorer";
import { OpenNow } from "@/components/open-now";
import { OrgLogo } from "@/components/org-logo";
import { getOpenPrograms, getOrgSummaries, getSite } from "@/lib/data";
import { absUrl, jsonLd, SITE_NAME } from "@/lib/site";

/** Stagger helper for the entrance animation. */
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function Home() {
  const site = getSite();
  const orgs = getOrgSummaries();
  const accepting = orgs.filter((o) => o.accepting).length;
  // Well-known orgs whose logos read well at small size; falls back to the busiest orgs.
  const FEATURED = ["kubernetes", "wasmedge", "kubeedge", "jaeger", "kyverno", "harbor", "opentelemetry"];
  const featured = FEATURED.map((slug) => orgs.find((o) => o.slug === slug && o.logoUrl)).filter((o) => o !== undefined);
  const logoOrgs = (featured.length >= 5 ? featured : orgs.filter((o) => o.logoUrl)).slice(0, 7);
  const stats = [
    { value: orgs.length, label: "organizations" },
    { value: site.programCount, label: `programs since ${site.years[0]}` },
    { value: accepting, label: "accepting now" },
  ];

  return (
    <Explorer orgs={orgs} years={site.years} foundations={site.foundations} skills={site.skills}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: absUrl("/"),
          description: "Unofficial explorer for Linux Foundation LFX Mentorship organizations and their past projects.",
          inLanguage: "en",
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${absUrl("/")}?q={search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        })}
      />
      <section
        aria-labelledby="page-title"
        className="relative isolate -mx-4 overflow-hidden px-4 pb-6 pt-12 text-center sm:-mx-6 sm:px-6 sm:pt-16 md:-mx-8 md:px-8"
      >
        {/* Small semicircle glow at the top (decorative) */}
        <div
          aria-hidden="true"
          className="animate-breathe pointer-events-none absolute left-1/2 top-0 -z-10 h-[230px] w-[min(600px,92%)] rounded-b-full bg-[radial-gradient(ellipse_at_top,rgb(122_192_250/0.42),transparent_72%)] dark:bg-[radial-gradient(ellipse_at_top,rgb(122_192_250/0.4),rgb(0_154_255/0.12)_45%,transparent_72%)]"
        />

        {/* Stacked org logos; they spread apart on hover */}
        <div
          className="animate-fade-up group inline-flex items-center gap-3 rounded-full border border-line bg-surface/80 py-1.5 pl-1.5 pr-4 shadow-card backdrop-blur"
          style={delay(0)}
        >
          <ul className="flex" aria-label={`Some of the orgs: ${logoOrgs.map((o) => o.name).join(", ")}`}>
            {logoOrgs.map((o, i) => (
              <li
                key={o.slug}
                style={
                  {
                    zIndex: logoOrgs.length - i,
                    // spread one after another: each logo starts a little later
                    transition: `margin-left 520ms cubic-bezier(0.22,1,0.36,1) ${i * 35}ms, transform 360ms cubic-bezier(0.22,1,0.36,1)`,
                  } as CSSProperties
                }
                className={`group/logo relative rounded-full ring-2 ring-bg will-change-transform hover:!z-20 hover:-translate-y-1 hover:scale-110 ${
                  i ? "-ml-3 group-hover:-ml-1" : ""
                } ${i >= 4 ? "hidden sm:block" : ""}`}
              >
                <OrgLogo name={o.name} src={o.logoUrl} size={36} round />
                {/* name label under the hovered logo */}
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-bg opacity-0 shadow-lg transition-[opacity,transform] duration-200 group-hover/logo:translate-y-0 group-hover/logo:opacity-100">
                  {o.name}
                </span>
              </li>
            ))}
          </ul>
          <p className="whitespace-nowrap text-sm text-muted">
            <span className="font-semibold text-ink">{orgs.length}</span> organizations
          </p>
        </div>

        <h1
          id="page-title"
          className="animate-fade-up mx-auto mt-7 max-w-3xl font-display text-[38px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[56px]"
          style={delay(90)}
        >
          Find your LFX{" "}
          <span className="bg-gradient-to-r from-[#009AFF] to-[#7AC0FA] bg-clip-text pb-1 text-transparent dark:bg-none dark:text-[#7AC0FA]">
            Mentorship
          </span>{" "}
          org
        </h1>
        <p
          className="animate-fade-up mx-auto mt-4 max-w-[54ch] text-[17px] leading-relaxed text-muted"
          style={delay(180)}
        >
          Every organization, year by year: what they built, which programs were paid, and who got selected.
        </p>

        <dl className="mx-auto mt-10 flex max-w-xl items-start justify-center divide-x divide-line">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="animate-fade-up flex flex-1 flex-col-reverse items-center px-3 sm:px-6"
              style={delay(270 + i * 90)}
            >
              <dt className="mt-2 text-[13px] text-muted">{s.label}</dt>
              <dd className="flex flex-col items-center">
                <span className="font-display text-[28px] font-semibold leading-none tracking-tight tabular-nums sm:text-[34px]">
                  <CountUp value={s.value} delay={350 + i * 120} />
                </span>
                <span
                  aria-hidden="true"
                  className="animate-grow-x mt-2.5 h-[3px] w-7 rounded-full bg-accent-fill"
                  style={{ ...delay(500 + i * 120), transformOrigin: "center" }}
                />
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="animate-fade-up" style={delay(360)}>
        <OpenNow programs={getOpenPrograms()} acceptingOrgs={accepting} />
      </div>
    </Explorer>
  );
}
