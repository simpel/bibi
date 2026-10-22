#!/usr/bin/env node
// Workload gate for the work-backlog workflow. Read-only: decides whether the workflow is worth its fixed cost
// (a worktree, CI and agents per ticket) or the tickets should be done in one session and one PR (the work-tickets skill).
// Usage: node tools/backlog/gate.mjs [--statuses Todo,Backlog] [--only 12,34] [--exclude 56]
// Prints one JSON object: { path: "workflow"|"inline"|"none", reason, ready, parallel, weight, blocked, bundle, tickets }.
// Rule (Why: the 2026-10-22 run spent 11 of 103 minutes coding): workflow when at least 3 tickets can run in parallel,
// or at least 2 and their sizes add up to GATE_WEIGHT (8, about two L tickets). Otherwise inline.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const WEIGHT = { XS: 1, S: 2, M: 3, L: 5, XL: 8 };
const MIN_PARALLEL = 3;
const MIN_WEIGHT = 8;

const weightOf = ({ ticket }) => WEIGHT[ticket.size] ?? 3;
const adrsOf = ({ ticket }) => ticket.labels.filter((l) => l.startsWith("adr:"));

// Tickets with no open blocker, in board order. Agent findings wait in Backlog for a human, as in the workflow.
export function readyTickets({ tickets, statuses }) {
  return tickets
    .filter((t) => t.openBlockers.length === 0 && statuses.includes(t.status))
    .filter((t) => !(t.labels.includes("source:agent") && t.status === "Backlog"))
    .sort((a, b) => (a.priority || "P9").localeCompare(b.priority || "P9") || a.number - b.number);
}

// How many tickets can run side by side: one per ADR (they edit the same files), and an exclusive ticket
// (codemod, XL) runs alone.
export function parallelCount({ ready }) {
  if (ready.some((t) => t.kind === "Codemod" || t.size === "XL")) return 1;
  const taken = new Set();
  let count = 0;
  for (const ticket of ready) {
    const adrs = adrsOf({ ticket });
    if (adrs.some((a) => taken.has(a))) continue;
    adrs.forEach((a) => taken.add(a));
    count++;
  }
  return count;
}

export function decide({
  tickets,
  statuses = ["Todo"],
  minParallel = MIN_PARALLEL,
  minWeight = MIN_WEIGHT,
}) {
  const ready = readyTickets({ tickets, statuses });
  const blocked = tickets.filter((t) => t.openBlockers.length > 0).length;
  const weight = ready.reduce((sum, ticket) => sum + weightOf({ ticket }), 0);
  const parallel = parallelCount({ ready });
  const bundle = ready
    .filter((t) => ["Docs", "Test"].includes(t.kind) && weightOf({ ticket: t }) <= 2)
    .map((t) => t.number);
  const base = { ready: ready.map((t) => t.number), parallel, weight, blocked, bundle };
  if (!ready.length)
    return { path: "none", reason: `no unblocked tickets (${blocked} blocked)`, ...base };
  const big = parallel >= minParallel || (parallel >= 2 && weight >= minWeight);
  const facts = `${ready.length} ready, ${parallel} parallel, weight ${weight}`;
  if (big)
    return { path: "workflow", reason: `${facts}: enough work to pay for the workflow`, ...base };
  return {
    path: "inline",
    reason: `${facts}: below ${minParallel} parallel (or 2 with weight ${minWeight}); do it in one session and one PR`,
    ...base,
  };
}

function selectTickets({ argv }) {
  const select = fileURLToPath(new URL("./select.mjs", import.meta.url));
  const out = execFileSync("node", [select, ...argv], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const parsed = JSON.parse(out);
  if (!parsed.ok) throw new Error(parsed.problem);
  return parsed.tickets;
}

function main() {
  try {
    const argv = process.argv.slice(2);
    const at = argv.indexOf("--statuses");
    const statuses = at >= 0 ? argv[at + 1].split(",") : ["Todo"];
    const tickets = selectTickets({ argv });
    const decision = decide({ tickets, statuses });
    console.log(
      JSON.stringify({
        ...decision,
        tickets: tickets.filter((t) => decision.ready.includes(t.number)),
      }),
    );
  } catch (error) {
    const problem =
      error instanceof Error ? error.message.split("\n").slice(0, 10).join("\n") : String(error);
    console.log(JSON.stringify({ path: "failed", reason: problem, ready: [], tickets: [] }));
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
