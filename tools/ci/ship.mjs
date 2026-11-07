#!/usr/bin/env node
// Ships the commits on HEAD that main lacks through a pull request with auto-merge (ADR 0098).
//   pnpm ship [--footer "text"] [--dry-run]
// Pushes HEAD to its own branch, opens a PR titled with HEAD's commit subject (a Conventional Commit, ADR 0060) and
// turns on auto-merge with a merge commit. Protected main merges it once CI is green; nobody waits for it.
import { spawnSync } from "node:child_process";

/** A branch name from the commit subject and its short sha: `ship/<slug>-<sha7>`. */
export function branchName({ subject, sha }) {
  const slug = subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
    .replace(/-$/, "");
  return `ship/${slug}-${sha.slice(0, 7)}`;
}

/** The PR body: one line per shipped commit, newest first, then the optional footer. */
export function prBody({ commits, footer }) {
  const lines = commits.map(({ sha, subject }) => `- ${sha.slice(0, 7)} ${subject}`);
  const body = ["Commits:", "", ...lines].join("\n");
  return footer ? `${body}\n\n${footer}` : body;
}

function run({ command, args, quiet = false }) {
  const out = spawnSync(command, args, { encoding: "utf8", stdio: quiet ? "pipe" : "inherit" });
  if (out.status !== 0) {
    const detail = quiet ? `${out.stdout ?? ""}${out.stderr ?? ""}`.trim() : "";
    throw new Error(`${command} ${args.join(" ")} failed${detail ? `:\n${detail}` : ""}`);
  }
  return (out.stdout ?? "").trim();
}

const git = ({ args }) => run({ command: "git", args, quiet: true });

function parse({ argv }) {
  const o = { footer: "", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--") continue;
    if (argv[i] === "--footer") o.footer = argv[++i] ?? "";
    else if (argv[i] === "--dry-run") o.dryRun = true;
    else throw new Error(`Unknown option: ${argv[i]}`);
  }
  return o;
}

function main() {
  const o = parse({ argv: process.argv.slice(2) });
  git({ args: ["fetch", "--quiet", "origin", "main"] });
  const log = git({ args: ["log", "--format=%H%x09%s", "origin/main..HEAD"] });
  const commits = log
    ? log.split("\n").map((line) => {
        const [sha, subject] = line.split("\t");
        return { sha, subject };
      })
    : [];
  if (commits.length === 0)
    throw new Error("Nothing to ship: HEAD has no commits that origin/main lacks.");
  const { sha, subject } = commits[0];
  const branch = branchName({ subject, sha });
  const body = prBody({ commits, footer: o.footer });
  if (o.dryRun) {
    console.log(`Would push ${sha.slice(0, 7)} to ${branch} and open "${subject}":\n\n${body}`);
    return;
  }
  run({ command: "git", args: ["push", "--quiet", "origin", `HEAD:refs/heads/${branch}`] });
  const prArgs = [
    "pr",
    "create",
    "--base",
    "main",
    "--head",
    branch,
    "--title",
    subject,
    "--body",
    body,
  ];
  const url = run({ command: "gh", args: prArgs, quiet: true });
  try {
    run({ command: "gh", args: ["pr", "merge", url, "--auto", "--merge"], quiet: true });
    console.log(`Shipped: ${url}\nIt merges by itself once CI is green.`);
  } catch (error) {
    console.log(
      `Opened ${url}, but auto-merge could not be turned on, so it stays open.\n${error.message}`,
    );
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
