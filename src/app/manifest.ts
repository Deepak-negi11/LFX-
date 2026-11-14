import type { MetadataRoute } from "next";

// Built once at build time (static export).
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LFX Orgs: LFX Mentorship organizations, year by year",
    short_name: "LFX Orgs",
    description: "Unofficial explorer for Linux Foundation LFX Mentorship organizations and their past projects.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#009AFF",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
