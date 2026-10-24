#!/usr/bin/env node
// The checks, defined once in tools/ci/checks.json. CI runs `node tools/ci/verify.mjs --all`; the ticket loop
// runs it through tools/backlog/checks.sh, scoped to the files a ticket changed.
//   node tools/ci/verify.mjs [--all | --light | --only a,b] [--base origin/main] [--changed a,b] [--json] [--list]
// Default (auto): checks without `paths` always run, checks with `paths` only when a changed file matches (all of them
// when the changed files cannot be read). --all ignores paths. --light runs the light checks. --only runs exactly
// those ids. fast checks all run and are all reported; slow checks run when the fast ones passed; last checks (build)
// run when everything before passed. --json prints one line {green, failures:[{check, output}], ran, skipped} and
// exits 0; without it output streams and the exit code is 1 on failure.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

export function loadManifest({ file = join(HERE, "checks.json") } = {}) {
  return JSON.parse(readFileSync(file, "utf8")).checks;
}

export function matchesPaths({ paths, changed }) {
  return changed.some((file) => paths.some((pattern) => new RegExp(pattern).test(file)));
}

// Which checks run. `changed` is null when the changed files are unknown (then everything runs).
export function selectChecks({ checks, mode, only, changed }) {
  if (mode === "only") return checks.filter((c) => only.includes(c.id));
  if (mode === "light") return checks.filter((c) => c.light);
  const own = checks.filter((c) => !c.job);
  if (mode === "all" || changed === null) return own;
  return own.filter((c) => !c.paths || matchesPaths({ paths: c.paths, changed }));
}

function git(args) {
  const out = spawnSync("git", args, { encoding: "utf8" });
  return out.status === 0 ? out.stdout.split("\n").filter(Boolean) : null;
}

// Files changed since `base` plus uncommitted and untracked ones; null when git cannot tell.
export function changedFiles({ base }) {
  const committed = git(["diff", "--name-only", `${base}...HEAD`]);
  const working = git(["diff", "--name-only", "HEAD"]);
  const untracked = git(["ls-files", "--others", "--exclude-standard"]);
  if (!committed || !working || !untracked) return null;
  return [...new Set([...committed, ...working, ...untracked])];
}

function runOne({ check, json }) {
  const result = spawnSync("sh", ["-c", check.command], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    stdio: json ? "pipe" : "inherit",
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.split("\n").slice(-60).join("\n");
  return { ok: result.status === 0, output };
}

export function runChecks({ checks, json, run = runOne }) {
  const failures = [];
  const ran = [];
  const skipped = [];
  let fastFailed = false;
  for (const stage of ["fast", "slow", "last"]) {
    // Slow checks would only repeat a fast failure; last checks (build) need everything before to be green.
    const blocked = (stage === "slow" && fastFailed) || (stage === "last" && failures.length > 0);
    for (const check of checks.filter((c) => c.stage === stage)) {
      if (blocked) {
        skipped.push(check.id);
        continue;
      }
      if (!json) console.log(`\n==> ${check.name}`);
      const result = run({ check, json });
      ran.push(check.id);
      if (!result.ok) failures.push({ check: check.name, output: result.output });
    }
    if (stage === "fast") fastFailed = failures.length > 0;
  }
  return { green: failures.length === 0, failures, ran, skipped };
}

function parse({ argv }) {
  const o = {
    mode: "auto",
    only: [],
    base: "origin/main",
    changed: undefined,
    json: false,
    list: false,
    manifest: undefined,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") o.mode = "all";
    else if (a === "--light") o.mode = "light";
    else if (a === "--only") {
      o.mode = "only";
      o.only = (argv[++i] ?? "").split(",").filter(Boolean);
    } else if (a === "--base") o.base = argv[++i];
    else if (a === "--changed") o.changed = (argv[++i] ?? "").split(",").filter(Boolean);
    else if (a === "--manifest") o.manifest = argv[++i];
    else if (a === "--json") o.json = true;
    else if (a === "--list") o.list = true;
    else throw new Error(`Unknown option: ${a}`);
  }
  return o;
}

function main() {
  const o = parse({ argv: process.argv.slice(2) });
  const all = loadManifest(o.manifest ? { file: o.manifest } : {});
  if (o.list) {
    for (const c of all) console.log(`${c.id}\t${c.stage}\t${c.command}`);
    return;
  }
  const changed = o.changed ?? (o.mode === "auto" ? changedFiles({ base: o.base }) : null);
  const checks = selectChecks({ checks: all, mode: o.mode, only: o.only, changed });
  const report = runChecks({ checks, json: o.json });
  if (o.json) console.log(JSON.stringify(report));
  else process.exitCode = report.green ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
