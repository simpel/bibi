// Run log shared by metrics.mjs and metrics-report.mjs: one JSON object per line, outside the git tree.

import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function metricsFile() {
  const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
    encoding: "utf8",
  }).trim();
  return join(dirname(dirname(common)), "bibi-worktrees", ".metrics", "runs.jsonl");
}

export function readRuns({ file }) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function appendRun({ file, run }) {
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, `${JSON.stringify(run)}\n`);
}

// Whole minutes between two ISO timestamps, or null when the start is unknown.
export function minutesBetween({ since, at }) {
  if (!since) return null;
  return Math.round(((Date.parse(at) - Date.parse(since)) / 60000) * 10) / 10;
}
