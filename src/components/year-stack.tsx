import type { CSSProperties } from "react";
import type { Program } from "@/lib/types";

type YearRow = { year: number; programs: Program[]; paid: number; mentees: number };

/** The year a mentee's term ran: the year in the term label, else the program's latest year. */
function menteeYear(term: string | null, programYears: number[]): number | undefined {
  const m = term?.match(/\b(20\d\d)\b/);
  return m ? Number(m[1]) : programYears.at(-1);
}

/**
 * Years stacked top to bottom (newest first), one horizontal bar per year.
 * Hover or focus a year to see that year's details; click to jump to its programs.
 * Pure CSS (group-hover / focus-within), so it works without JavaScript.
 */
export function YearStack({ years, programs }: { years: number[]; programs: Program[] }) {
  if (years.length === 0) return null;
  const first = years[0];
  const last = years.at(-1)!;
  const rows: YearRow[] = [];
  for (let y = last; y >= first; y--) {
    const list = programs.filter((p) => p.years.includes(y));
    rows.push({
      year: y,
      programs: list,
      paid: list.filter((p) => p.paid).length,
      mentees: list.reduce((n, p) => n + p.mentees.filter((m) => menteeYear(m.term, p.years) === y).length, 0),
    });
  }
  const max = Math.max(1, ...rows.map((r) => r.programs.length));

  return (
    <ol className="space-y-1.5">
      {rows.map((r, i) => {
        const pct = (r.programs.length / max) * 100;
        const style = { "--d": `${i * 70}ms` } as CSSProperties;
        if (r.programs.length === 0) {
          return (
            <li key={r.year} className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3 py-1.5">
              <span className="text-sm font-semibold tabular-nums text-faint">{r.year}</span>
              <span className="text-sm text-faint">Did not take part</span>
            </li>
          );
        }
        return (
          <li key={r.year} className="group relative">
            <a
              href={`#y${r.year}`}
              className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3 rounded-lg px-0 py-1.5 transition-colors hover:bg-sky-soft focus-visible:bg-sky-soft"
            >
              <span className="text-sm font-semibold tabular-nums text-ink">{r.year}</span>
              <span className="flex min-w-0 items-center gap-2.5 pr-2">
                <span
                  className="animate-grow-x h-7 rounded-md bg-gradient-to-r from-accent-fill to-sky transition-[filter] group-hover:brightness-110"
                  style={{ ...style, width: `max(${pct}%, 10px)` }}
                />
                <span className="shrink-0 text-sm tabular-nums text-muted">
                  <span className="font-semibold text-ink">{r.programs.length}</span>
                  <span className="hidden sm:inline"> program{r.programs.length === 1 ? "" : "s"}</span>
                </span>
              </span>
            </a>

            {/* Details for this year, shown on hover / keyboard focus */}
            <div
              role="tooltip"
              className="pointer-events-none invisible absolute left-14 top-full z-30 mt-1 w-[min(440px,calc(100%-3.5rem))] translate-y-1 rounded-xl border border-line bg-surface p-4 opacity-0 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.35)] transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
            >
              <p className="font-display text-base font-semibold">{r.year}</p>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
                <Mini label="programs" value={r.programs.length} />
                <Mini label="paid" value={r.paid} />
                <Mini label="mentees" value={r.mentees} />
              </dl>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {r.programs.slice(0, 4).map((p) => (
                  <li key={p.id} className="line-clamp-1">
                    {p.title}
                  </li>
                ))}
                {r.programs.length > 4 && <li className="text-faint">+{r.programs.length - 4} more</li>}
              </ul>
              <p className="mt-3 text-xs font-medium text-accent">Click to see all {r.year} programs</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col-reverse rounded-lg bg-sky-soft py-1.5">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="text-[15px] font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
