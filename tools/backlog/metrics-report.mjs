// The summary behind `metrics.mjs report`: the run log joined with what GitHub knows about each PR.
import { execFileSync } from "node:child_process";
import { readRuns } from "./metrics-store.mjs";

const REPO = "simpel/bibi";

function gh({ args }) {
  try {
    return JSON.parse(
      execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }),
    );
  } catch {
    return null;
  }
}

// Open-to-merge minutes, lines and CI failures of one PR; null when GitHub cannot be read.
export function prFacts({ pr }) {
  const view = gh({
    args: [
      "pr",
      "view",
      String(pr),
      "-R",
      REPO,
      "--json",
      "createdAt,mergedAt,additions,deletions,headRefName",
    ],
  });
  if (!view) return null;
  const runs =
    gh({
      args: [
        "run",
        "list",
        "-R",
        REPO,
        "--branch",
        view.headRefName,
        "--workflow",
        "CI",
        "-L",
        "30",
        "--json",
        "conclusion",
      ],
    }) ?? [];
  const minutes = view.mergedAt
    ? Math.round((Date.parse(view.mergedAt) - Date.parse(view.createdAt)) / 60000)
    : null;
  return {
    minutes,
    lines: view.additions + view.deletions,
    redRuns: runs.filter((r) => r.conclusion === "failure").length,
    merged: Boolean(view.mergedAt),
  };
}

const sum = ({ values }) => values.reduce((a, b) => a + b, 0);
const avg = ({ values }) =>
  values.length ? Math.round((sum({ values }) / values.length) * 10) / 10 : "n/a";
const median = ({ values }) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : "n/a";
};

export function report({ file }) {
  const runs = readRuns({ file });
  if (!runs.length) return `No runs recorded in ${file} yet.`;
  const byPath = Object.groupBy(runs, (r) => r.path);
  const done = runs.filter((r) => ["loop", "workflow", "inline"].includes(r.path));
  const tickets = done.flatMap((r) => r.tickets);
  const facts = tickets
    .filter((t) => t.pr)
    .map((t) => prFacts({ pr: t.pr }))
    .filter(Boolean);
  const roundsAvg = (key) =>
    avg({ values: tickets.map((t) => t[key]).filter((n) => typeof n === "number") });
  const lines = [
    `Runs: ${runs.length} (${Object.entries(byPath)
      .map(([p, r]) => `${p} ${r.length}`)
      .join(", ")})`,
  ];
  for (const path of ["loop", "workflow", "inline"]) {
    const rs = (byPath[path] ?? []).filter((r) => r.minutes !== null);
    const n = sum({ values: rs.map((r) => r.tickets.length) });
    lines.push(
      `${path}: ${rs.length} timed runs, ${avg({ values: rs.map((r) => r.minutes) })} min per run, ${n ? Math.round((sum({ values: rs.map((r) => r.minutes) }) / n) * 10) / 10 : "n/a"} min per ticket`,
    );
  }
  lines.push(
    `Tickets: ${tickets.length}; outcomes ${JSON.stringify(Object.fromEntries(Object.entries(Object.groupBy(tickets, (t) => t.outcome)).map(([k, v]) => [k, v.length])))}`,
  );
  lines.push(
    `Rounds per ticket: ${roundsAvg("fixRounds")} fix (red checks before the PR), ${roundsAvg("landRounds")} land (conflict or red after rebase)`,
    `PRs read from GitHub: ${facts.length}; median open-to-merge ${median({ values: facts.map((f) => f.minutes).filter((m) => m !== null) })} min; ${sum({ values: facts.map((f) => f.redRuns) })} red CI runs (${avg({ values: facts.map((f) => f.redRuns) })} per PR); ${avg({ values: facts.map((f) => f.lines) })} changed lines per PR`,
  );
  const tokens = done.map((r) => r.outputTokens).filter((n) => typeof n === "number");
  if (tokens.length) lines.push(`Output tokens per workflow run: ${avg({ values: tokens })}`);
  const costs = tickets.map((t) => t.costUsd).filter((n) => typeof n === "number");
  if (costs.length)
    lines.push(`Cost per loop ticket: ${avg({ values: costs })} USD (${costs.length} tickets)`);
  lines.push(
    `Gate: ${(byPath["gate-inline"] ?? []).length} runs sent inline, ${(byPath["gate-none"] ?? []).length} found nothing ready`,
  );
  return lines.join("\n");
}
