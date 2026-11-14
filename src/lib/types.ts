export type Term = {
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  appsOpen: string | null;
  appsClose: string | null;
  status: string | null;
};

/** A program accepting applications right now, for the "Open now" list. */
export type OpenProgram = {
  id: string;
  title: string;
  url: string;
  orgSlug: string;
  orgName: string;
  term: string | null;
  appsClose: string | null;
  paid: boolean | null;
  skills: string[];
};

export type Mentee = { name: string; term: string | null; status: string | null };

export type Program = {
  id: string;
  title: string;
  fullName: string;
  url: string;
  repoUrl: string | null;
  logoUrl: string | null;
  status: "acceptance" | "in-progress" | "completed" | string;
  years: number[];
  terms: Term[];
  skills: string[];
  /** true = sponsored, false = no sponsor / titled unpaid, null = unknown */
  paid: boolean | null;
  amountUsd: number | null;
  mentors: string[];
  mentees: Mentee[];
  description: string;
  updatedAt: string;
};

export type Org = {
  slug: string;
  name: string;
  foundation: string;
  foundationFull: string;
  logoUrl: string | null;
  description: string;
  years: number[];
  skills: string[];
  programCount: number;
  paidCount: number;
  unpaidCount: number;
  menteeCount: number;
  accepting: boolean;
  lastActive: string | null;
  programs: Program[];
};

export type SiteData = {
  generatedAt: string;
  fetchedAt: string;
  programCount: number;
  years: number[];
  foundations: { name: string; orgs: number }[];
  skills: { name: string; orgs: number }[];
  orgs: Org[];
};

/** What the home page needs per org. Kept small because it ships to the browser. */
export type OrgSummary = {
  slug: string;
  name: string;
  foundation: string;
  logoUrl: string | null;
  /** most recent program, shown on the card */
  latest: { title: string; year: number | null } | null;
  years: number[];
  /** years with at least one sponsored program */
  paidYears: number[];
  skills: string[];
  programCount: number;
  paidCount: number;
  menteeCount: number;
  accepting: boolean;
  /** has a program running right now */
  inProgress: boolean;
  lastActive: string | null;
};
