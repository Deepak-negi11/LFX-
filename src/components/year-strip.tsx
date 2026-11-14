import type { CSSProperties } from "react";

/**
 * Years the org took part in: one thin bar per year with the short year under it.
 * Blue bar = took part that year, grey = didn't. A ring marks years picked in the filter.
 */
export function YearStrip({
  allYears,
  years,
  paidYears,
  highlight = [],
}: {
  allYears: number[];
  years: number[];
  paidYears?: number[];
  highlight?: number[];
}) {
  const active = new Set(years);
  const paid = new Set(paidYears ?? []);
  const hl = new Set(highlight);
  const label = years.length ? `Took part in ${years.join(", ")}` : "No years recorded";
  return (
    <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${allYears.length}, minmax(0, 1fr))` }} aria-label={label}>
      {allYears.map((y, i) => {
        const on = active.has(y);
        const picked = hl.has(y);
        return (
          <li
            key={y}
            aria-hidden="true"
            title={on ? `${y}: took part${paid.has(y) ? " (paid)" : ""}` : `${y}: not in LFX`}
            className="flex flex-col items-center gap-1"
          >
            <span
              style={{ "--d": `${120 + i * 45}ms` } as CSSProperties}
              className={[
                "h-1.5 w-full rounded-full",
                on ? "animate-grow-x bg-accent-fill" : "bg-surface-3",
                picked ? "outline outline-2 outline-offset-1 outline-sky" : "",
              ].join(" ")}
            />
            <span className={`text-[11px] tabular-nums ${on ? "font-semibold text-ink" : "text-faint"}`}>
              {"'"}
              {String(y).slice(2)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
