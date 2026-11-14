/**
 * Shared pieces for the share images (Open Graph / X cards), rendered at build time with
 * next/og. next/og supports a subset of CSS: flexbox only, every multi-child div needs display:flex.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

/** The site's own fonts, read from the @fontsource packages at build time (no network). */
export async function ogFonts() {
  const file = (pkg: string, name: string) => readFile(join(process.cwd(), "node_modules/@fontsource", pkg, "files", name));
  const [display, body, bodySemi] = await Promise.all([
    file("bricolage-grotesque", "bricolage-grotesque-latin-800-normal.woff"),
    file("plus-jakarta-sans", "plus-jakarta-sans-latin-400-normal.woff"),
    file("plus-jakarta-sans", "plus-jakarta-sans-latin-600-normal.woff"),
  ]);
  return [
    { name: "Display", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Body", data: body, weight: 400 as const, style: "normal" as const },
    { name: "Body", data: bodySemi, weight: 600 as const, style: "normal" as const },
  ];
}

export const C = {
  bg: "#171717",
  text: "#F2F4F7",
  muted: "#A1A1AA",
  faint: "#3A3A3F",
  blue: "#009AFF",
  sky: "#7AC0FA",
};

/** Dark canvas with the soft blue semicircle glow and the wordmark at the bottom. */
export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        padding: "64px 72px",
        position: "relative",
        fontFamily: "Body",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -220,
          left: 300,
          width: 600,
          height: 440,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(122,192,250,0.30) 0%, rgba(0,154,255,0.10) 45%, rgba(23,23,23,0) 70%)",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>{children}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28 }}>
        <div style={{ display: "flex", fontFamily: "Display", fontWeight: 800, letterSpacing: -1 }}>
          <span style={{ color: C.text }}>LFX</span>
          <span style={{ color: C.blue, marginLeft: 10 }}>Orgs</span>
        </div>
        <div style={{ display: "flex", color: C.muted, fontSize: 22 }}>Unofficial LFX Mentorship explorer</div>
      </div>
    </div>
  );
}

/** Year bars: blue = took part that year. */
export function YearBars({ all, active }: { all: number[]; active: number[] }) {
  const on = new Set(active);
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {all.map((y) => (
        <div key={y} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 92 }}>
          <div style={{ display: "flex", width: "100%", height: 12, borderRadius: 6, background: on.has(y) ? C.blue : C.faint }} />
          <div style={{ display: "flex", fontSize: 22, color: on.has(y) ? C.text : C.muted }}>{String(y)}</div>
        </div>
      ))}
    </div>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginRight: 64 }}>
      <div style={{ display: "flex", fontFamily: "Display", fontSize: 64, fontWeight: 800, color: C.text, letterSpacing: -2 }}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </div>
      <div style={{ display: "flex", fontSize: 24, color: C.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}
