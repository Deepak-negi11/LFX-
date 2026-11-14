import { ImageResponse } from "next/og";
import { getOrg, getSite } from "@/lib/data";
import { C, Frame, OG_SIZE, Stat, YearBars, ogFonts } from "@/lib/og";

// One image per org, built at build time (static export).
export const dynamic = "force-static";
export const dynamicParams = false;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "LFX Mentorship organization summary";

export function generateStaticParams() {
  return getSite().orgs.map((o) => ({ slug: o.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = getSite();
  const org = getOrg(slug)!;
  const span = org.years.length > 1 ? `${org.years[0]} to ${org.years.at(-1)}` : String(org.years[0] ?? "");
  // Long names get a smaller font so they fit on one or two lines.
  const nameSize = org.name.length > 34 ? 56 : org.name.length > 22 ? 68 : 84;
  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: "flex", fontSize: 28, color: C.sky, marginTop: 8 }}>
          {org.foundation !== org.name && !org.name.includes(org.foundation) ? `${org.foundation} · ` : ""}LFX Mentorship {span}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Display",
            fontSize: nameSize,
            fontWeight: 800,
            color: C.text,
            letterSpacing: -2.5,
            lineHeight: 1.05,
            marginTop: 14,
            maxWidth: 1050,
          }}
        >
          {org.name}
        </div>
        <div style={{ display: "flex", marginTop: 40 }}>
          <YearBars all={site.years} active={org.years} />
        </div>
        <div style={{ display: "flex", marginTop: 44 }}>
          <Stat value={org.programCount} label="programs" />
          <Stat value={org.paidCount} label="paid" />
          <Stat value={org.menteeCount} label="mentees selected" />
        </div>
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
