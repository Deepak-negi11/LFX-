// Turns the raw crawl (data/raw/*.json) into the compact data the site renders:
//   src/data/site.json  -> { generatedAt, fetchedAt, years, foundations, skills, orgs[] }
//
// Usage: node scripts/build-data.mjs

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LFX = "https://mentorship.linuxfoundation.org/programs";

// Foundations that host many separate projects. Programs under these are grouped
// by project ("CNCF - Karmada: ..." -> Karmada) instead of by foundation.
const UMBRELLAS = new Set([
  "cncf",
  "lf-decentralized-trust",
  "hyperledger",
  "lf-ai-data",
  "lfai",
  "lf-edge",
  "lfn",
  "lf-networking",
  "lf-energy",
  "linux-foundation",
  "the-linux-foundation",
  "lfx",
]);

// LF Decentralized Trust / Hyperledger titles rarely use "Project:" prefixes, so
// we look for a known project name anywhere in the title.
const KNOWN_PROJECTS = [
  "Fabric-X", "Fabric", "Besu", "Solang", "Cacti", "Cactus", "Weaver", "Web3j", "Hiero", "Iroha",
  "Indy", "Aries", "AnonCreds", "Ursa", "Caliper", "Bevel", "Fablo", "Cello", "Identus", "Paladin",
  "FireFly", "Firefly", "Lockness", "Explorer", "Learning Tokens", "BiniBFT", "Sawtooth", "Burrow",
  "Grid", "Transact", "Avalon", "AIFAQ", "AI-FAQ", "CREDEBL", "Minifabric", "Hypernate", "Trust over IP",
  "ToIP", "Climate", "OTAS", "GitMesh", "Hedera", "Substrate", "Umbra", "Soul Protocol", "DRman",
  // LF Networking
  "OpenDaylight", "ODL", "ONAP", "OPNFV", "Anuket", "FD.io", "L3AF",
];
// Different names for the same project.
const ALIASES = {
  Cactus: "Cacti",
  Weaver: "Cacti",
  Firefly: "FireFly",
  "AI-FAQ": "AIFAQ",
  ToIP: "Trust over IP",
  "Fabric-X": "Fabric",
  Minifabric: "Fabric",
  Hedera: "Hiero",
  ODL: "OpenDaylight",
  OpenTokenizedAssetStandard: "OTAS",
};

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "other";

const stripHtml = (html = "") =>
  html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|h\d)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1) > 0 ? s.lastIndexOf(" ", n - 1) : n - 1) + "…");

// Short foundation label, e.g. "Cloud Native Computing Foundation (CNCF)" -> "CNCF".
function shortFoundation(name = "") {
  const m = name.match(/\(([^)]+)\)\s*$/);
  return m ? m[1] : name;
}

// "CNCF - Karmada: Refactor the scheduler (2025 Term 2)" -> { project: "Karmada", title: "Refactor the scheduler" }
function parseTitle(name) {
  let rest = name.trim();
  let project = null;
  const prefixed = rest.match(/^([A-Za-z][\w&.]*(?:\s[A-Za-z][\w&.]*)?)\s*-\s*(.+)$/);
  if (prefixed) {
    const afterPrefix = prefixed[2];
    const colon = afterPrefix.match(/^([^:]{2,60}):\s*(.+)$/);
    if (colon) {
      project = colon[1].trim();
      rest = colon[2];
    } else {
      rest = afterPrefix;
    }
  }
  const title = rest
    .replace(/\s*\((?:\d{4}\s*)?term\s*\d[^)]*\)\s*/gi, " ")
    .replace(/\s*[-(]?\s*\bunpaid\b\s*\)?/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[-:]\s*$/, "")
    .trim();
  return { project, title: title || name };
}

function knownProject(name) {
  let best = null;
  for (const p of KNOWN_PROJECTS) {
    const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const m = name.match(re);
    if (m && (best === null || m.index < best.index)) best = { index: m.index, project: ALIASES[p] ?? p };
  }
  return best?.project ?? null;
}

// GitHub owners that hold many projects, so the repo name says more than the owner.
const GENERIC_OWNERS = new Set(["hyperledger", "hyperledger-labs", "hyperledger-tooling", "cncf", "lf-edge", "lfnetworking", "linuxfoundation", "kubernetes", "kubernetes-sigs"]);

const pretty = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Project name from the repo URL, e.g. github.com/LFDT-Lockness -> Lockness,
// github.com/hyperledger/solang -> Solang. Returns null when the URL says nothing useful.
function projectFromRepo(url) {
  const m = (url ?? "").match(/github\.com\/([^/\s#?]+)(?:\/([^/\s#?]+))?/i);
  if (!m) return null;
  const owner = m[1];
  const repo = m[2];
  if (GENERIC_OWNERS.has(owner.toLowerCase())) {
    if (!repo) return null;
    return knownProject(repo.replace(/[-_]/g, " ")) ?? null;
  }
  // For other owners the repo name is usually the project ("qbtrix/soul-protocol").
  const raw = (repo ?? owner).replace(/^(lfdt|hyperledger)-/i, "").replace(/-(io|sh|dev|project|org)$/i, "");
  const words = raw.replace(/[-_]+/g, " ");
  return knownProject(words) ?? ALIASES[raw] ?? words.split(" ").map(pretty).join(" ");
}

// Older programs are often named just after the project ("Chaos Mesh", "Jaeger Mentorship").
function shortName(name) {
  const n = name.replace(/\bmentorship\b/i, "").trim();
  if (/[-:]/.test(n) || n.split(/\s+/).length > 3) return null;
  return n;
}

function orgFor(program) {
  const f = program.foundation ?? { slug: "unknown", name: "Unknown" };
  if (!UMBRELLAS.has(f.slug)) return { name: f.name, foundation: f };
  const { project } = parseTitle(program.name);
  const colonFirst = program.name.match(/^[A-Za-z]+:\s*([^-]{2,40}?)\s+-\s+/); // "CNCF: Kyverno - ..."
  const named =
    project ??
    colonFirst?.[1] ??
    knownProject(program.name) ??
    shortName(program.name) ??
    projectFromRepo(program.repositoryUrl);
  // "Iroha 1" or "BiniBFT Implementation" -> the known project inside the name.
  if (named) return { name: ALIASES[named] ?? knownProject(named) ?? named, foundation: f };
  return { name: `${shortFoundation(f.name)} (other projects)`, foundation: f };
}

const isTestProgram = (p) => /^(cncf\s*-\s*)?sample project$/i.test(p.name.trim());

const yearOf = (iso) => (iso ? Number(iso.slice(0, 4)) : null);

function programYears(p) {
  const ys = new Set();
  for (const t of p.terms ?? []) {
    const y = yearOf(t.startsAt) ?? Number((t.name.match(/\b(20\d\d)\b/) ?? [])[1]);
    if (y) ys.add(y);
  }
  if (ys.size === 0) {
    const y = Number((p.name.match(/\b(20[12]\d)\b/) ?? [])[1]);
    if (y) ys.add(y);
  }
  return [...ys].sort();
}

// Paid status from the sponsors endpoint. `isPaid` on the list endpoint is not reliable.
function paidInfo(detail, name) {
  // A title that says "unpaid" wins over sponsor data.
  if (/\bunpaid\b/i.test(name)) return { paid: false, amountUsd: null };
  const s = detail?.sponsors;
  if (!s || !Array.isArray(s.sponsors)) return { paid: null, amountUsd: null };
  const cents = s.sponsors.reduce((sum, x) => sum + (x.amountCents ?? 0), 0);
  if (cents > 0) return { paid: true, amountUsd: Math.round(cents / 100) };
  return { paid: false, amountUsd: null };
}

async function main() {
  const { fetchedAt, programs } = JSON.parse(await readFile(join(root, "data/raw/programs.json"), "utf8"));
  const details = JSON.parse(await readFile(join(root, "data/raw/details.json"), "utf8"));

  // Orgs are keyed by name, so "Meshery" the foundation and "CNCF - Meshery" land together.
  const orgs = new Map();
  for (const p of programs) {
    if (isTestProgram(p)) continue;
    const o = orgFor(p);
    const key = slugify(o.name);
    if (!orgs.has(key)) orgs.set(key, { name: o.name, foundations: new Map(), programs: [] });
    const entry = orgs.get(key);
    const fCount = entry.foundations.get(o.foundation.name) ?? { foundation: o.foundation, n: 0 };
    fCount.n++;
    entry.foundations.set(o.foundation.name, fCount);
    const d = details[p.id];
    const { paid, amountUsd } = paidInfo(d, p.name);
    const terms = (p.terms ?? [])
      .map((t) => ({
        name: t.name,
        startsAt: t.startsAt ?? null,
        endsAt: t.endsAt ?? null,
        appsOpen: t.applicationsStartAt ?? null,
        appsClose: t.applicationsCloseAt ?? null,
        status: t.status ?? null,
      }))
      .sort((a, b) => (b.startsAt ?? "").localeCompare(a.startsAt ?? ""));
    entry.programs.push({
      id: p.id,
      title: parseTitle(p.name).title,
      fullName: p.name,
      url: `${LFX}/${p.id}`,
      repoUrl: p.repositoryUrl || null,
      logoUrl: p.logoUrl || null,
      status: p.status, // acceptance | in-progress | completed
      years: programYears(p),
      terms,
      skills: [...new Set((p.skills ?? []).map((s) => s.trim()).filter(Boolean))],
      paid,
      amountUsd,
      mentors: (p.mentors ?? []).map((m) => m.name).filter(Boolean),
      // Only name, term and status: no intros or photos of mentees are republished.
      mentees: (d?.mentees ?? []).map((m) => ({ name: m.name, term: m.termLabel ?? null, status: m.status ?? null })),
      description: truncate(stripHtml(p.description), 320),
      updatedAt: p.updatedAt,
    });
  }

  // Fold sub-project names into their parent: "Kubernetes SIG Storage" -> Kubernetes,
  // "WasmEdge Runtime" -> WasmEdge, "Meshery/SMI" -> Meshery, "Knative Eventing" -> Knative.
  const ALSO_PARENTS = ["Knative"];
  for (const name of ALSO_PARENTS) {
    const key = slugify(name);
    if (!orgs.has(key)) orgs.set(key, { name, foundations: new Map(), programs: [] });
  }
  const byLength = [...orgs.entries()].sort((a, b) => b[1].name.length - a[1].name.length);
  for (const [key, child] of byLength) {
    const lower = child.name.toLowerCase();
    const parent = [...orgs.entries()]
      .filter(([k, o]) => k !== key && lower.startsWith(o.name.toLowerCase()) && /^[\s/]/.test(lower.slice(o.name.length)))
      .sort((a, b) => b[1].name.length - a[1].name.length)[0];
    if (!parent) continue;
    const target = parent[1];
    target.programs.push(...child.programs);
    for (const [fname, fc] of child.foundations) {
      const cur = target.foundations.get(fname) ?? { foundation: fc.foundation, n: 0 };
      cur.n += fc.n;
      target.foundations.set(fname, cur);
    }
    orgs.delete(key);
  }
  for (const [key, o] of orgs) if (o.programs.length === 0) orgs.delete(key);

  const skillCount = new Map();
  const foundationCount = new Map();
  const allYears = new Set();
  const out = [];
  const usedSlugs = new Set();

  for (const o of orgs.values()) {
    // An org that appears under several foundations is listed under the most common one.
    o.foundation = [...o.foundations.values()].sort((a, b) => b.n - a.n)[0].foundation;
    o.programs.sort(
      (a, b) =>
        (b.years.at(-1) ?? 0) - (a.years.at(-1) ?? 0) ||
        (b.terms[0]?.startsAt ?? "").localeCompare(a.terms[0]?.startsAt ?? "") ||
        a.title.localeCompare(b.title),
    );
    const years = [...new Set(o.programs.flatMap((p) => p.years))].sort();
    years.forEach((y) => allYears.add(y));

    const skills = new Map();
    for (const p of o.programs) for (const s of p.skills) {
      const k = s.toLowerCase();
      const cur = skills.get(k) ?? { name: s, n: 0 };
      cur.n++;
      skills.set(k, cur);
    }
    const topSkills = [...skills.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)).map((s) => s.name);
    // Count how many orgs use each skill (for the skill filter).
    for (const [k, v] of skills) {
      const cur = skillCount.get(k) ?? { name: v.name, n: 0 };
      cur.n++;
      skillCount.set(k, cur);
    }

    const foundationShort = shortFoundation(o.foundation.name);
    foundationCount.set(foundationShort, (foundationCount.get(foundationShort) ?? 0) + 1);

    let slug = slugify(o.name);
    if (usedSlugs.has(slug)) slug = `${slug}-${slugify(foundationShort)}`;
    usedSlugs.add(slug);

    const newest = o.programs[0];
    const logo = o.programs.find((p) => p.logoUrl)?.logoUrl ?? null;
    out.push({
      slug,
      name: o.name,
      foundation: foundationShort,
      foundationFull: o.foundation.name,
      logoUrl: logo,
      description: newest?.description ?? "",
      years,
      skills: topSkills.slice(0, 12),
      programCount: o.programs.length,
      paidCount: o.programs.filter((p) => p.paid === true).length,
      unpaidCount: o.programs.filter((p) => p.paid === false).length,
      menteeCount: o.programs.reduce((n, p) => n + p.mentees.length, 0),
      accepting: o.programs.some((p) => p.status === "acceptance"),
      lastActive: newest?.terms[0]?.startsAt ?? null,
      programs: o.programs,
    });
  }

  out.sort((a, b) => b.programCount - a.programCount || a.name.localeCompare(b.name));

  const site = {
    generatedAt: new Date().toISOString(),
    fetchedAt,
    programCount: programs.length,
    years: [...allYears].sort(),
    foundations: [...foundationCount.entries()].sort((a, b) => b[1] - a[1]).map(([name, orgs]) => ({ name, orgs })),
    skills: [...skillCount.values()].sort((a, b) => b.n - a.n).slice(0, 60).map((s) => ({ name: s.name, orgs: s.n })),
    orgs: out,
  };

  await mkdir(join(root, "src/data"), { recursive: true });
  await writeFile(join(root, "src/data/site.json"), JSON.stringify(site));
  console.log(`orgs: ${out.length}, programs: ${programs.length}, years: ${site.years.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
