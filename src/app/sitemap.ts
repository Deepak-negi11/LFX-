import type { MetadataRoute } from "next";
import { getSite } from "@/lib/data";
import { absUrl } from "@/lib/site";

// Built once at build time (static export).
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSite();
  const fetched = new Date(site.fetchedAt);
  return [
    { url: absUrl("/"), lastModified: fetched, changeFrequency: "daily", priority: 1 },
    { url: absUrl("/about/"), lastModified: fetched, changeFrequency: "monthly", priority: 0.3 },
    ...site.orgs.map((o) => {
      // Last time any of this org's programs changed on LFX.
      const latest = o.programs.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), "");
      return {
        url: absUrl(`/org/${o.slug}/`),
        lastModified: latest ? new Date(latest) : fetched,
        changeFrequency: (o.accepting ? "daily" : "weekly") as "daily" | "weekly",
        priority: o.programCount >= 10 ? 0.8 : 0.6,
      };
    }),
  ];
}
