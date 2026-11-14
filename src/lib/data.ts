import "server-only";
import raw from "@/data/site.json";
import type { OpenProgram, Org, OrgSummary, SiteData } from "./types";

const site = raw as SiteData;

export function getSite() {
  return site;
}

export function getOrg(slug: string): Org | undefined {
  return site.orgs.find((o) => o.slug === slug);
}

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(" ", n) > 0 ? s.lastIndexOf(" ", n) : n)}…`);

export function getOrgSummaries(): OrgSummary[] {
  return site.orgs.map((o) => ({
    slug: o.slug,
    name: o.name,
    foundation: o.foundation,
    logoUrl: o.logoUrl,
    latest: o.programs[0] ? { title: clip(o.programs[0].title, 110), year: o.programs[0].years.at(-1) ?? null } : null,
    years: o.years,
    paidYears: [...new Set(o.programs.filter((p) => p.paid).flatMap((p) => p.years))].sort(),
    skills: o.skills, // all top skills, so the skill filter can match any of them
    programCount: o.programCount,
    paidCount: o.paidCount,
    menteeCount: o.menteeCount,
    accepting: o.accepting,
    inProgress: o.programs.some((p) => p.status === "in-progress"),
    lastActive: o.lastActive,
  }));
}

/** Programs accepting applications, soonest deadline first. */
export function getOpenPrograms(): OpenProgram[] {
  const out: OpenProgram[] = [];
  for (const o of site.orgs) {
    for (const p of o.programs) {
      if (p.status !== "acceptance") continue;
      const term = p.terms.find((t) => t.status === "open") ?? p.terms[0];
      out.push({
        id: p.id,
        title: p.title,
        url: p.url,
        orgSlug: o.slug,
        orgName: o.name,
        term: term?.name ?? null,
        appsClose: term?.appsClose ?? null,
        paid: p.paid,
        skills: p.skills.slice(0, 4),
      });
    }
  }
  return out.sort((a, b) => (a.appsClose ?? "9999").localeCompare(b.appsClose ?? "9999"));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
