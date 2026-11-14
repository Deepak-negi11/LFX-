import { ImageResponse } from "next/og";
import { getSite } from "@/lib/data";
import { C, Frame, OG_SIZE, Stat, ogFonts } from "@/lib/og";

// Built once at build time (static export).
export const dynamic = "force-static";
export const alt = "LFX Orgs: every LFX Mentorship organization, year by year";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const site = getSite();
  const accepting = site.orgs.filter((o) => o.accepting).length;
  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
          <div style={{ display: "flex", fontFamily: "Display", fontSize: 76, fontWeight: 800, color: C.text, letterSpacing: -3, lineHeight: 1.05 }}>
            Find your LFX
          </div>
          <div style={{ display: "flex", fontFamily: "Display", fontSize: 76, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05 }}>
            <span style={{ color: C.sky }}>Mentorship</span>
            <span style={{ color: C.text, marginLeft: 22 }}>org</span>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: C.muted, marginTop: 24 }}>
            Past projects year by year, skills, paid status and selected mentees.
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 56 }}>
          <Stat value={site.orgs.length} label="organizations" />
          <Stat value={site.programCount} label={`programs since ${site.years[0]}`} />
          <Stat value={accepting} label="accepting now" />
        </div>
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
