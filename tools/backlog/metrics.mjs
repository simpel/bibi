#!/usr/bin/env node
// Run log for work-backlog and the work-tickets skill, so the way of working can be evaluated later with real numbers.
//   node tools/backlog/metrics.mjs start                      prints the current ISO time (the inline path keeps it)
//   node tools/backlog/metrics.mjs record --path <workflow|inline|gate-inline|gate-none> [--since <iso>] [--note <text>]
//                                          (a JSON payload on stdin: { tickets: [{ number, size, kind, model, outcome, pr, fixRounds, landRounds }],
//                                          gate?, outputTokens? })
//   node tools/backlog/metrics.mjs report                     summary of all runs, PR facts read from GitHub
// The log is bibi-worktrees/.metrics/runs.jsonl. It is a local file on purpose: nothing here may push to main (ADR 0065).
import { readFileSync } from "node:fs";
import { report } from "./metrics-report.mjs";
import { appendRun, metricsFile, minutesBetween } from "./metrics-store.mjs";

const PATHS = ["workflow", "inline", "gate-inline", "gate-none"];

function flag({ argv, name }) {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 ? argv[at + 1] : undefined;
}

function record({ argv }) {
  const path = flag({ argv, name: "path" });
  if (!PATHS.includes(path)) throw new Error(`--path must be one of ${PATHS.join(", ")}`);
  const stdin = readFileSync(0, "utf8").trim();
  const payload = stdin ? JSON.parse(stdin) : {};
  const at = new Date().toISOString();
  const since = flag({ argv, name: "since" });
  const run = {
    at,
    since: since ?? null,
    minutes: minutesBetween({ since, at }),
    path,
    note: flag({ argv, name: "note" }) ?? "",
    tickets: [],
    ...payload,
  };
  appendRun({ file: metricsFile(), run });
  console.log(JSON.stringify({ ok: true, file: metricsFile(), minutes: run.minutes }));
}

function main() {
  const [command, ...argv] = process.argv.slice(2);
  try {
    if (command === "start") console.log(new Date().toISOString());
    else if (command === "record") record({ argv });
    else if (command === "report") console.log(report({ file: metricsFile() }));
    else throw new Error("usage: metrics.mjs start | record --path <p> | report");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

main();
