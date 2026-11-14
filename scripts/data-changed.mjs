// Did the site data really change since the last commit?
// Compares src/data/site.json with the committed version, ignoring timestamps
// (generatedAt / fetchedAt change on every run even when nothing else does).
//
// Exit code 0 = changed (commit it), 1 = unchanged (skip the commit).

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const strip = (text) => {
  const data = JSON.parse(text);
  delete data.generatedAt;
  delete data.fetchedAt;
  return JSON.stringify(data);
};

let previous;
try {
  previous = execFileSync("git", ["show", "HEAD:src/data/site.json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
} catch {
  console.log("No committed site.json yet: treating as changed.");
  process.exit(0);
}

const current = readFileSync("src/data/site.json", "utf8");
if (strip(previous) === strip(current)) {
  console.log("Data unchanged (only timestamps differ).");
  process.exit(1);
}
console.log("Data changed.");
process.exit(0);
