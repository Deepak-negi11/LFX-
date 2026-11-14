import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { OpenProgram } from "@/lib/types";
import { formatDate } from "@/lib/data";
import { ShowAllOpen } from "./show-all-open";

/** Cards shown in the row; in LFX season hundreds can be open, so the rest go behind "See all". */
const MAX = 8;

/** Programs accepting applications right now, soonest deadline first. */
export function OpenNow({ programs, acceptingOrgs }: { programs: OpenProgram[]; acceptingOrgs: number }) {
  if (programs.length === 0) {
    return (
      <p className="mt-10 rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm text-muted">
        No program is accepting applications right now. New terms show up here the day after LFX lists them.
      </p>
    );
  }
  return (
    <section aria-labelledby="open-now" className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="open-now" className="font-display text-xl font-semibold tracking-tight">
          Open for applications{" "}
          <span className="font-sans text-base font-medium tabular-nums text-muted">({programs.length})</span>
        </h2>
        {acceptingOrgs > 0 && <ShowAllOpen count={acceptingOrgs} />}
      </div>
      <p className="mt-1 text-sm text-muted">Closing soonest first.</p>
      <ul className="scroll-quiet relative -mx-1 mt-4 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {programs.slice(0, MAX).map((p) => (
          <li
            key={p.id}
            className="flex w-[280px] shrink-0 snap-start flex-col rounded-xl border border-line bg-surface p-4 shadow-card"
          >
            <Link href={`/org/${p.orgSlug}/`} className="truncate text-[13px] text-muted hover:text-accent">
              {p.orgName}
            </Link>
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 line-clamp-2 font-semibold leading-snug hover:text-accent"
            >
              {p.title}
              <ArrowUpRight size={14} weight="bold" className="ml-1 inline align-baseline" aria-hidden="true" />
              <span className="sr-only"> (opens on LFX)</span>
            </a>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-[13px] text-muted">
              {p.appsClose ? (
                <span>
                  Closes <time dateTime={p.appsClose}>{formatDate(p.appsClose)}</time>
                </span>
              ) : (
                <span />
              )}
              <PaidTag paid={p.paid} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PaidTag({ paid, amountUsd }: { paid: boolean | null; amountUsd?: number | null }) {
  if (paid === true)
    return (
      <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
        Paid{amountUsd ? ` · $${amountUsd.toLocaleString("en-US")} funded` : ""}
      </span>
    );
  if (paid === false)
    return <span className="rounded-md border border-line px-2 py-0.5 text-xs font-medium text-muted">Unpaid</span>;
  return <span className="rounded-md border border-line px-2 py-0.5 text-xs font-medium text-muted">Pay unknown</span>;
}
