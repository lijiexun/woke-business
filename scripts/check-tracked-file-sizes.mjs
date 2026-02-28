#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";

const LIMIT_MB = Number.parseInt(process.env.MAX_TRACKED_FILE_MB ?? "40", 10);
const LIMIT_BYTES = LIMIT_MB * 1024 * 1024;

function getTrackedFiles() {
  const output = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" });
  return output.split("\0").filter(Boolean);
}

const offenders = [];
for (const file of getTrackedFiles()) {
  try {
    const size = statSync(file).size;
    if (size > LIMIT_BYTES) offenders.push({ file, size });
  } catch {
    // Ignore files that may be deleted in index transitions.
  }
}

if (!offenders.length) {
  console.log(`OK: no tracked files exceed ${LIMIT_MB} MB.`);
  process.exit(0);
}

console.error(`Tracked files exceed ${LIMIT_MB} MB limit:`);
for (const { file, size } of offenders.sort((a, b) => b.size - a.size)) {
  const mb = (size / (1024 * 1024)).toFixed(2);
  console.error(`- ${file}: ${mb} MB`);
}
console.error("Remove large files from git tracking before push (or use Git LFS intentionally).");
process.exit(1);
