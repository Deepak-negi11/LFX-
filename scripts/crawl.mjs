// Fetches every LFX Mentorship program plus its mentees and sponsors from the
// public (undocumented) API that mentorship.linuxfoundation.org itself uses.
//
// Usage: node scripts/crawl.mjs [--full]
//   By default, details (mentees, sponsors) are reused from the last crawl for
//   programs whose `updatedAt` has not changed. `--full` refetches everything.
//
// Output: data/raw/programs.json, data/raw/details.json

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://mentorship.linuxfoundation.org/api/programs";
const PAGE_SIZE = 20; // the API caps `limit` at 20
const CONCURRENCY = 4;
const DELAY_MS = 150; // pause after each request, per worker
const UA = "lfx-orgs-explorer/0.1 (unofficial, read-only crawler)";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = join(root, "data", "raw");
const full = process.argv.includes("--full");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, { allow404 = false } = {}) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
      if (res.status === 404 && allow404) return null;
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt === 4) throw err;
      await sleep(1000 * 2 ** attempt);
    }
  }
}

// Runs `fn` over `items` with a fixed number of workers.
async function pool(items, fn, label) {
  const out = new Array(items.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
      done++;
      if (done % 50 === 0 || done === items.length) {
        process.stdout.write(`\r${label}: ${done}/${items.length}`);
      }
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write("\n");
  return out;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  await mkdir(rawDir, { recursive: true });

  const first = await getJson(`${API}?offset=0&limit=${PAGE_SIZE}`);
  const total = first.total;
  const offsets = [];
  for (let o = PAGE_SIZE; o < total; o += PAGE_SIZE) offsets.push(o);
  const pages = await pool(offsets, (o) => getJson(`${API}?offset=${o}&limit=${PAGE_SIZE}`), "program pages");

  const byId = new Map();
  for (const p of [first, ...pages].flatMap((pg) => pg.data)) byId.set(p.id, p);
  const programs = [...byId.values()];
  console.log(`programs: ${programs.length} (API total ${total})`);
  if (programs.length < total * 0.95) {
    throw new Error("Got far fewer programs than the API reported; refusing to overwrite data.");
  }

  const previous = full ? {} : await readJson(join(rawDir, "details.json"), {});
  let reused = 0;
  const detailList = await pool(
    programs,
    async (p) => {
      const old = previous[p.id];
      if (old && old.updatedAt === p.updatedAt && p.status === "completed") {
        reused++;
        return [p.id, old];
      }
      const [mentees, sponsors] = await Promise.all([
        getJson(`${API}/${p.id}/mentees`, { allow404: true }),
        getJson(`${API}/${p.id}/sponsors`, { allow404: true }),
      ]);
      return [p.id, { updatedAt: p.updatedAt, mentees: mentees ?? [], sponsors: sponsors ?? null }];
    },
    "program details",
  );
  console.log(`details reused from last crawl: ${reused}`);

  await writeFile(join(rawDir, "programs.json"), JSON.stringify({ fetchedAt: new Date().toISOString(), programs }));
  await writeFile(join(rawDir, "details.json"), JSON.stringify(Object.fromEntries(detailList)));
  console.log("saved data/raw/programs.json and data/raw/details.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
