#!/usr/bin/env node
// Picks and claims the next ticket for one loop slot. No model is involved.
//   node tools/loop/pick.mjs --slot <k> [--dry-run]
// Prints one JSON line: { ok, ticket: {number,title,itemId,priority,size,kind,model,effort,labels} | null, skipped, problem? }.
// A claim is the directory bibi-worktrees/.loop/claims/<N> (atomic mkdir), with claim.json { slot, labels, at }.
// --dry-run claims nothing. run.sh moves the card and releases the claim.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { choose } from "./pick-rules.mjs";

const REPO = "simpel/bibi";
const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = "packages/db/prisma/";

const run = ({ cmd, args }) =>
  execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

export function claimsDir() {
  const common = run({
    cmd: "git",
    args: ["rev-parse", "--path-format=absolute", "--git-common-dir"],
  });
  return join(dirname(dirname(common.trim())), "bibi-worktrees", ".loop", "claims");
}

function readClaims({ dir }) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const file = join(dir, name, "claim.json");
    if (!existsSync(file)) return [];
    const claim = JSON.parse(readFileSync(file, "utf8"));
    return [
      { number: Number(name), labels: claim.labels, schema: claim.labels.includes("area:db") },
    ];
  });
}

// Open ticket/* pull requests: their issue labels, and whether they change the Prisma schema.
function openPullRequests() {
  const prs = JSON.parse(
    run({
      cmd: "gh",
      args: [
        "pr",
        "list",
        "-R",
        REPO,
        "--state",
        "open",
        "-L",
        "100",
        "--json",
        "headRefName,files",
      ],
    }),
  ).filter((pr) => /^ticket\/\d+$/.test(pr.headRefName));
  const issues = JSON.parse(
    run({
      cmd: "gh",
      args: [
        "issue",
        "list",
        "-R",
        REPO,
        "--state",
        "open",
        "-L",
        "1000",
        "--json",
        "number,labels",
      ],
    }),
  );
  const labelsOf = new Map(issues.map((i) => [i.number, i.labels.map((l) => l.name)]));
  return prs.map((pr) => {
    const number = Number(pr.headRefName.split("/")[1]);
    const schema = (pr.files ?? []).some((f) => f.path.startsWith(SCHEMA_PATH));
    return { number, labels: labelsOf.get(number) ?? [], schema };
  });
}

function boardTickets() {
  const out = JSON.parse(run({ cmd: "node", args: [join(HERE, "../backlog/select.mjs")] }));
  if (!out.ok) throw new Error(out.problem);
  return out.tickets;
}

// mkdir is atomic: a second slot that races for the same ticket gets EEXIST and picks again.
function claim({ dir, ticket, slot }) {
  mkdirSync(dir, { recursive: true });
  try {
    mkdirSync(join(dir, String(ticket.number)));
  } catch {
    return false;
  }
  const body = { slot, labels: ticket.labels, at: new Date().toISOString() };
  writeFileSync(join(dir, String(ticket.number), "claim.json"), JSON.stringify(body));
  return true;
}

function pick({ slot, dryRun }) {
  const dir = claimsDir();
  const tickets = boardTickets();
  const inflight = [...readClaims({ dir }), ...openPullRequests()];
  for (;;) {
    const { ticket, skipped } = choose({ tickets, inflight });
    if (!ticket || dryRun || claim({ dir, ticket, slot })) return { ok: true, ticket, skipped };
    inflight.push({ number: ticket.number, labels: ticket.labels, schema: false });
  }
}

function main() {
  const argv = process.argv.slice(2);
  const slot = Number(argv[argv.indexOf("--slot") + 1]);
  try {
    if (!Number.isInteger(slot) || slot < 1)
      throw new Error("usage: pick.mjs --slot <k> [--dry-run]");
    console.log(JSON.stringify(pick({ slot, dryRun: argv.includes("--dry-run") })));
  } catch (error) {
    const problem = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.log(JSON.stringify({ ok: false, ticket: null, skipped: [], problem }));
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
