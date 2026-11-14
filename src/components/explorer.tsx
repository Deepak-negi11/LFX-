"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, FunnelSimple, MagnifyingGlass, X } from "@phosphor-icons/react";
import type { OrgSummary } from "@/lib/types";
import { OrgLogo } from "./org-logo";
import { SortMenu } from "./sort-menu";
import { YearStrip } from "./year-strip";

type Sort = "programs" | "recent" | "mentees" | "name";

type Filters = {
  q: string;
  years: number[];
  allYears: boolean;
  foundation: string;
  skills: string[];
  paidOnly: boolean;
  acceptingOnly: boolean;
  sort: Sort;
};

const EMPTY: Filters = {
  q: "",
  years: [],
  allYears: false,
  foundation: "",
  skills: [],
  paidOnly: false,
  acceptingOnly: false,
  sort: "programs",
};

const SORTS: { value: Sort; label: string }[] = [
  { value: "programs", label: "Most programs" },
  { value: "recent", label: "Most recent" },
  { value: "mentees", label: "Most mentees" },
  { value: "name", label: "Name A to Z" },
];

function readUrl(): Filters {
  const p = new URLSearchParams(window.location.search);
  const sort = p.get("sort") as Sort | null;
  return {
    q: p.get("q") ?? "",
    years: (p.get("years") ?? "").split(",").map(Number).filter(Boolean),
    allYears: p.get("every") === "1",
    foundation: p.get("foundation") ?? "",
    skills: (p.get("skills") ?? "").split(",").filter(Boolean),
    paidOnly: p.get("paid") === "1",
    acceptingOnly: p.get("accepting") === "1",
    sort: SORTS.some((s) => s.value === sort) ? (sort as Sort) : "programs",
  };
}

function writeUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.years.length) p.set("years", f.years.join(","));
  if (f.allYears) p.set("every", "1");
  if (f.foundation) p.set("foundation", f.foundation);
  if (f.skills.length) p.set("skills", f.skills.join(","));
  if (f.paidOnly) p.set("paid", "1");
  if (f.acceptingOnly) p.set("accepting", "1");
  if (f.sort !== "programs") p.set("sort", f.sort);
  const qs = p.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function Explorer({
  orgs,
  years,
  foundations,
  skills,
  children,
}: {
  orgs: OrgSummary[];
  years: number[];
  foundations: { name: string; orgs: number }[];
  skills: { name: string; orgs: number }[];
  /** Page intro (heading, stats, open programs), shown above the results. */
  children?: ReactNode;
}) {
  const [f, setF] = useState<Filters>(EMPTY);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const q = useDeferredValue(f.q);

  // Restore filters from the URL once, after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser-only state
    setF(readUrl());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) writeUrl(f);
  }, [f, ready]);

  const set = (patch: Partial<Filters>) => setF((cur) => ({ ...cur, ...patch }));

  // "See all" in the Open now section turns on the accepting filter.
  useEffect(() => {
    const show = () => {
      setF((cur) => ({ ...cur, acceptingOnly: true }));
      document.getElementById("results")?.scrollIntoView({ block: "start" });
    };
    window.addEventListener("lfx:show-accepting", show);
    return () => window.removeEventListener("lfx:show-accepting", show);
  }, []);
  const clearAll = () => setF((cur) => ({ ...EMPTY, sort: cur.sort }));

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const wantSkills = f.skills.map((s) => s.toLowerCase());
    const list = orgs.filter((o) => {
      if (needle) {
        const hay = `${o.name} ${o.foundation} ${o.skills.join(" ")} ${o.latest?.title ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (f.foundation && o.foundation !== f.foundation) return false;
      if (f.acceptingOnly && !o.accepting) return false;
      if (f.years.length) {
        const ok = f.allYears ? f.years.every((y) => o.years.includes(y)) : f.years.some((y) => o.years.includes(y));
        if (!ok) return false;
      }
      if (f.paidOnly) {
        const ok = f.years.length ? f.years.some((y) => o.paidYears.includes(y)) : o.paidCount > 0;
        if (!ok) return false;
      }
      if (wantSkills.length) {
        const have = o.skills.map((s) => s.toLowerCase());
        if (!wantSkills.every((s) => have.includes(s))) return false;
      }
      return true;
    });
    const by: Record<Sort, (a: OrgSummary, b: OrgSummary) => number> = {
      programs: (a, b) => b.programCount - a.programCount || a.name.localeCompare(b.name),
      recent: (a, b) => (b.lastActive ?? "").localeCompare(a.lastActive ?? "") || b.programCount - a.programCount,
      mentees: (a, b) => b.menteeCount - a.menteeCount || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return list.sort(by[f.sort]);
  }, [orgs, q, f]);

  // Re-run the card entrance when filters or sort change (not on every keystroke).
  const animKey = JSON.stringify([f.years, f.allYears, f.foundation, f.skills, f.paidOnly, f.acceptingOnly, f.sort]);

  const activeCount =
    f.years.length + (f.foundation ? 1 : 0) + f.skills.length + (f.paidOnly ? 1 : 0) + (f.acceptingOnly ? 1 : 0);

  const panelProps = { f, set, years, foundations, skills, activeCount, clearAll };

  return (
    <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] md:grid-cols-[240px_minmax(0,1fr)]">
      {/* Side menu (tablet and up) */}
      <aside
        aria-label="Filters"
        className="scroll-quiet hidden border-r border-line md:sticky md:top-16 md:block md:h-[calc(100dvh-4rem)] md:overflow-y-auto"
      >
        <div className="px-5 pb-10 pt-7">
          <FilterPanel {...panelProps} idPrefix="side" />
        </div>
      </aside>

      <div className="min-w-0 px-4 pb-20 sm:px-6 md:px-8">
        {children}

        <div id="results" className="sticky top-16 z-20 -mx-4 mt-10 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <label htmlFor="org-search" className="sr-only">
                Search organizations
              </label>
              <input
                id="org-search"
                name="q"
                type="search"
                autoComplete="off"
                spellCheck={false}
                value={f.q}
                onChange={(e) => set({ q: e.target.value })}
                placeholder="Search orgs, skills or topics…"
                className="h-11 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-[15px] text-ink transition-colors placeholder:text-muted hover:border-line-strong focus:border-sky focus:outline-none focus:ring-4 focus:ring-sky-soft"
              />
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-controls="filter-drawer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium transition-colors hover:border-line-strong active:scale-[0.98] md:hidden"
            >
              <FunnelSimple size={16} aria-hidden="true" />
              <span>Filters</span>
              {activeCount > 0 && (
                <span className="rounded-md bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-on">{activeCount}</span>
              )}
            </button>
            <div className="hidden sm:block">
              <SortMenu value={f.sort} options={SORTS} onChange={(v) => set({ sort: v })} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <p className="mr-1 text-muted" aria-live="polite">
            <span className="font-semibold tabular-nums text-ink">{results.length}</span> of {orgs.length} organizations
          </p>
          {f.years.map((y) => (
            <ActiveChip key={y} label={String(y)} onRemove={() => set({ years: f.years.filter((x) => x !== y) })} />
          ))}
          {f.allYears && f.years.length > 1 && <ActiveChip label="Every selected year" onRemove={() => set({ allYears: false })} />}
          {f.foundation && <ActiveChip label={f.foundation} onRemove={() => set({ foundation: "" })} />}
          {f.skills.map((s) => (
            <ActiveChip key={s} label={s} onRemove={() => set({ skills: f.skills.filter((x) => x !== s) })} />
          ))}
          {f.paidOnly && <ActiveChip label="Paid" onRemove={() => set({ paidOnly: false })} />}
          {f.acceptingOnly && <ActiveChip label="Accepting now" onRemove={() => set({ acceptingOnly: false })} />}
          {(activeCount > 0 || f.q) && (
            <button type="button" onClick={clearAll} className="font-medium text-accent underline-offset-4 hover:underline">
              Clear all
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-line-strong px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold">No organizations match these filters</p>
            <p className="mx-auto mt-1 max-w-[46ch] text-sm text-muted">
              Try removing a year or a skill, or search for a shorter word.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover active:scale-[0.98]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul
            key={animKey}
            className="mt-5 grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          >
            {results.map((o, i) => (
              <li key={o.slug} className="animate-fade-up" style={{ "--d": `${Math.min(i, 11) * 40}ms` } as CSSProperties}>
                <OrgCard org={o} allYears={years} highlight={f.years} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} resultCount={results.length}>
        <FilterPanel {...panelProps} idPrefix="drawer" showSort />
      </FilterDrawer>
    </div>
  );
}

type PanelProps = {
  f: Filters;
  set: (patch: Partial<Filters>) => void;
  years: number[];
  foundations: { name: string; orgs: number }[];
  skills: { name: string; orgs: number }[];
  activeCount: number;
  clearAll: () => void;
  idPrefix: string;
  showSort?: boolean;
};

function FilterPanel({ f, set, years, foundations, skills, activeCount, clearAll, idPrefix, showSort }: PanelProps) {
  const [showAllFoundations, setShowAllFoundations] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const visibleFoundations = showAllFoundations ? foundations : foundations.slice(0, 6);
  const visibleSkills = skills
    .filter((s) => !skillQuery || s.name.toLowerCase().includes(skillQuery.toLowerCase()))
    .slice(0, skillQuery ? 40 : 20);

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold tracking-tight">Filters</h2>
        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="text-sm font-medium text-accent underline-offset-4 hover:underline">
            Clear {activeCount}
          </button>
        )}
      </div>

      {showSort && (
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Sort by</p>
          <SortMenu value={f.sort} options={SORTS} onChange={(v) => set({ sort: v })} fullWidth />
        </div>
      )}

      <fieldset className="space-y-3">
        <legend className="mb-3 text-[13px] font-semibold text-ink">Show only</legend>
        <Switch
          id={`${idPrefix}-paid`}
          label="Paid programs"
          checked={f.paidOnly}
          onChange={(v) => set({ paidOnly: v })}
        />
        <Switch
          id={`${idPrefix}-accepting`}
          label="Accepting applications now"
          checked={f.acceptingOnly}
          onChange={(v) => set({ acceptingOnly: v })}
        />
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-[13px] font-semibold text-ink">Year</legend>
        <div className="grid grid-cols-4 gap-1.5">
          {years.map((y) => {
            const on = f.years.includes(y);
            return (
              <button
                key={y}
                type="button"
                aria-pressed={on}
                onClick={() => set({ years: toggle(f.years, y).sort() })}
                className={`h-9 rounded-lg border text-[13px] font-medium tabular-nums transition-colors active:scale-[0.97] ${
                  on
                    ? "border-primary bg-primary text-primary-on"
                    : "border-line bg-surface text-muted hover:border-line-strong hover:bg-sky-soft hover:text-ink"
                }`}
              >
                {y}
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <Switch
            id={`${idPrefix}-every`}
            label="Came in every selected year"
            checked={f.allYears}
            onChange={(v) => set({ allYears: v })}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold text-ink">Foundation</legend>
        <ul className="-mx-2 space-y-px">
          <li>
            <FoundationOption label="All foundations" count={null} active={!f.foundation} onClick={() => set({ foundation: "" })} />
          </li>
          {visibleFoundations.map((fd) => (
            <li key={fd.name}>
              <FoundationOption
                label={fd.name}
                count={fd.orgs}
                active={f.foundation === fd.name}
                onClick={() => set({ foundation: f.foundation === fd.name ? "" : fd.name })}
              />
            </li>
          ))}
        </ul>
        {foundations.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAllFoundations((v) => !v)}
            className="mt-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {showAllFoundations ? "Show fewer" : `Show all ${foundations.length}`}
          </button>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-[13px] font-semibold text-ink">Skills</legend>
        <label htmlFor={`${idPrefix}-skill-search`} className="sr-only">
          Search skills
        </label>
        <input
          id={`${idPrefix}-skill-search`}
          name="skill"
          type="search"
          autoComplete="off"
          spellCheck={false}
          value={skillQuery}
          onChange={(e) => setSkillQuery(e.target.value)}
          placeholder="Find a skill, e.g. rust…"
          className="mb-3 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors placeholder:text-muted hover:border-line-strong focus:border-accent-fill focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map((s) => {
            const on = f.skills.some((x) => x.toLowerCase() === s.name.toLowerCase());
            return (
              <button
                key={s.name}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  set({
                    skills: on ? f.skills.filter((x) => x.toLowerCase() !== s.name.toLowerCase()) : [...f.skills, s.name],
                  })
                }
                className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors active:scale-[0.97] ${
                  on
                    ? "border-primary bg-primary text-primary-on"
                    : "border-line bg-surface text-muted hover:border-line-strong hover:bg-sky-soft hover:text-ink"
                }`}
              >
                {s.name}
              </button>
            );
          })}
          {visibleSkills.length === 0 && <p className="text-sm text-muted">No skill matches that.</p>}
        </div>
      </fieldset>
    </div>
  );
}

/** Accessible on/off switch (a real checkbox underneath, so label clicks and keyboard work). */
function Switch({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="group flex cursor-pointer items-center justify-between gap-3 text-sm text-ink">
      <span>{label}</span>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-5 w-9 rounded-full bg-surface-3 transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-fill" />
        <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

function FilterDrawer({
  open,
  onClose,
  resultCount,
  children,
}: {
  open: boolean;
  onClose: () => void;
  resultCount: number;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      id="filter-drawer"
      className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div
        className={`absolute inset-0 bg-scrim transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col border-r border-line bg-bg shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end px-3 pt-3">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">{children}</div>
        <div className="border-t border-line p-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover active:scale-[0.98]"
          >
            Show {resultCount} organizations
          </button>
        </div>
      </div>
    </div>
  );
}

function FoundationOption({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
        active ? "bg-sky-soft font-semibold text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      <span className="truncate">{label}</span>
      {count !== null && <span className="text-xs tabular-nums text-faint">{count}</span>}
    </button>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-xs font-medium text-ink transition-colors hover:bg-surface-3"
      aria-label={`Remove filter ${label}`}
    >
      {label}
      <X size={12} aria-hidden="true" />
    </button>
  );
}

function OrgCard({ org, allYears, highlight }: { org: OrgSummary; allYears: number[]; highlight: number[] }) {
  const span = org.years.length > 1 ? `${org.years[0]} to ${org.years.at(-1)}` : String(org.years[0] ?? "");
  return (
    <Link
      href={`/org/${org.slug}/`}
      className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-card transition-[border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-line-strong"
    >
      <div className="relative flex items-center gap-3">
        <OrgLogo name={org.name} src={org.logoUrl} size={44} />
        <ArrowUpRight
          size={18}
          weight="bold"
          aria-hidden="true"
          className="absolute right-0 top-0 -translate-x-1 translate-y-1 text-accent opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
        />
        <div className="min-w-0 flex-1">
          <h2
            className="truncate pr-6 font-display text-[17px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-accent"
            translate="no"
          >
            {org.name}
          </h2>
          <p className="truncate text-[13px] text-muted">
            {org.foundation}
            {span && <span className="text-faint"> · {span}</span>}
          </p>
        </div>
      </div>

      {org.latest && (
        <p className="mt-4 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-muted">
          <span className="font-medium text-ink">Latest:</span> {org.latest.title}
        </p>
      )}

      <div className="mt-4">
        <YearStrip allYears={allYears} years={org.years} paidYears={org.paidYears} highlight={highlight} />
      </div>

      {org.skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Top skills">
          {org.skills.slice(0, 3).map((s) => (
            <li key={s} className="max-w-full truncate rounded-md border border-line bg-surface-2 px-2 py-0.5 text-xs text-muted">
              {s}
            </li>
          ))}
          {org.skills.length > 3 && (
            <li className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-xs text-muted">+{org.skills.length - 3}</li>
          )}
        </ul>
      )}

      <div className="min-h-5 flex-1" aria-hidden="true" />
      <dl className="grid grid-cols-3 divide-x divide-line border-t border-line pt-4">
        <Metric label="programs" value={org.programCount} />
        <Metric label="paid" value={org.paidCount} />
        <Metric label="mentees" value={org.menteeCount} />
      </dl>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col-reverse items-center">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-base font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
