#!/usr/bin/env node
// Board read for the implement-ticket skill. Read-only: changes nothing on GitHub.
// Usage: node tools/backlog/select.mjs [--statuses Todo,Backlog] [--only 12,34] [--exclude 56]
// Prints one JSON object: { ok, problem?, tickets: [{ number, title, labels, itemId, priority, size, kind, model, effort, renames, status, openBlockers }] }.
// renames = the old names in the body's "### Renames" table (first column, in backticks; text in parentheses is ignored), used by the codemod gate.
// openBlockers = issues under "### Depends on" in the body plus native blocked-by, that are still open.
import { execFileSync } from "node:child_process";

const OWNER = "simpel";
const REPO = "simpel/bibi";
const PROJECT = "8";

function run({ cmd, args }) {
  return execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function parseArgs({ argv }) {
  const opts = { statuses: ["Todo"], only: null, exclude: [] };
  const numbers = (value) => value.split(",").filter(Boolean).map(Number);
  for (let i = 0; i < argv.length; i += 2) {
    const value = argv[i + 1] ?? "";
    if (argv[i] === "--statuses") opts.statuses = value.split(",").filter(Boolean);
    else if (argv[i] === "--only") opts.only = numbers(value);
    else if (argv[i] === "--exclude") opts.exclude = numbers(value);
    else throw new Error(`Unknown option: ${argv[i]}`);
  }
  return opts;
}

// Issue numbers listed in the body's "### Depends on" section, checked or not.
export function bodyBlockers({ body }) {
  const section = /^#{2,4}\s*Depends on\s*$([\s\S]*?)(?=^#{1,4}\s|(?![\s\S]))/im.exec(body ?? "");
  if (!section) return [];
  return [...section[1].matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
}

// Old names from the "### Renames" table of a rename ticket: the backticked tokens of each row's first column.
export function renamesFrom({ body }) {
  const section = /^#{2,4}\s*Renames\s*$([\s\S]*?)(?=^#{1,4}\s|(?![\s\S]))/im.exec(body ?? "");
  if (!section) return [];
  const names = new Set();
  for (const line of section[1].split("\n")) {
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 4 || /^-+$/.test(cells[1]) || cells[1].toLowerCase() === "old") continue;
    for (const match of cells[1].replace(/\([^)]*\)/g, "").matchAll(/`([^`]+)`/g))
      names.add(match[1].replace(/\/$/, ""));
  }
  return [...names];
}

function nativeBlockers({ number }) {
  const out = run({
    cmd: "gh",
    args: ["api", `repos/${REPO}/issues/${number}/dependencies/blocked_by`],
  });
  return JSON.parse(out).map((issue) => issue.number);
}

function openIssueNumbers() {
  const args = ["issue", "list", "-R", REPO, "--state", "open", "-L", "1000", "--json", "number"];
  return new Set(JSON.parse(run({ cmd: "gh", args })).map((issue) => issue.number));
}

// The Projects filter syntax: status:Todo,"In progress". Asking only for the wanted statuses keeps the GraphQL cost
// low (the quota is shared by every run); if the filter is rejected the whole board is read.
function statusQuery({ statuses }) {
  return `status:${statuses.map((s) => (s.includes(" ") ? `"${s}"` : s)).join(",")}`;
}

function boardItems({ statuses }) {
  const base = [
    "project",
    "item-list",
    PROJECT,
    "--owner",
    OWNER,
    "--format",
    "json",
    "-L",
    "1000",
  ];
  try {
    return JSON.parse(run({ cmd: "gh", args: [...base, "--query", statusQuery({ statuses })] }))
      .items;
  } catch {
    return JSON.parse(run({ cmd: "gh", args: base })).items;
  }
}

function isCandidate({ item, opts, open }) {
  const c = item.content ?? {};
  if (c.type !== "Issue" || c.repository !== REPO || !open.has(c.number)) return false;
  if (!opts.statuses.includes(item.status)) return false;
  if (opts.only && !opts.only.includes(c.number)) return false;
  return !opts.exclude.includes(c.number);
}

function toTicket({ item, open }) {
  const { number, title, body } = item.content;
  const blockers = new Set([...bodyBlockers({ body }), ...nativeBlockers({ number })]);
  return {
    number,
    title,
    labels: item.labels ?? [],
    itemId: item.id,
    priority: item.priority ?? "",
    size: item.size ?? "",
    kind: item.kind ?? "",
    model: item.model ?? "",
    effort: item.effort ?? "",
    renames: renamesFrom({ body }),
    status: item.status,
    openBlockers: [...blockers].filter((n) => n !== number && open.has(n)),
  };
}

function main() {
  try {
    const opts = parseArgs({ argv: process.argv.slice(2) });
    run({ cmd: "git", args: ["fetch", "origin", "--quiet"] });
    const open = openIssueNumbers();
    const items = boardItems({ statuses: opts.statuses }).filter((item) =>
      isCandidate({ item, opts, open }),
    );
    const tickets = items.map((item) => toTicket({ item, open }));
    console.log(JSON.stringify({ ok: true, tickets }));
  } catch (error) {
    const problem =
      error instanceof Error ? error.message.split("\n").slice(0, 10).join("\n") : String(error);
    console.log(JSON.stringify({ ok: false, problem, tickets: [] }));
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
