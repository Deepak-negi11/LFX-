"use client";

import { ArrowRight } from "@phosphor-icons/react";

/** Turns on the "Accepting applications now" filter (the explorer listens for this event). */
export function ShowAllOpen({ count }: { count: number }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("lfx:show-accepting"))}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent underline-offset-4 hover:underline"
    >
      See all {count} orgs accepting
      <ArrowRight size={14} weight="bold" aria-hidden="true" />
    </button>
  );
}
