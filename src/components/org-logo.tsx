"use client";

import { useState } from "react";

/** Org logo with an initials fallback when there is no logo or it fails to load. */
export function OrgLogo({
  name,
  src,
  size = 40,
  round = false,
}: {
  name: string;
  src: string | null;
  size?: number;
  /** circle instead of rounded square */
  round?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .replace(/\(.*?\)/g, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const box = `flex shrink-0 items-center justify-center overflow-hidden border border-line bg-[#fdfdfd] ${round ? "rounded-full" : "rounded-lg"}`;
  if (!src || failed) {
    return (
      <div className={`${box} font-display text-sm font-semibold text-zinc-600`} style={{ width: size, height: size }} aria-hidden="true">
        {initials}
      </div>
    );
  }
  return (
    <div className={box} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote logos on a static export */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading={size < 40 ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        className={`h-full w-full object-contain ${round ? "p-1" : size < 40 ? "p-0.5" : "p-1"}`}
      />
    </div>
  );
}
