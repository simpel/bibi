#!/usr/bin/env node
// Codemod to rename Ticket -> Order (and Swedish Bokning).
// Usage: node tools/rename-ticket-to-order.mjs [--write] [--verify] [--allow-dirty] [--root <path>]

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isBinaryBuffer, walkWorkspace } from "./lib/rename-app-walk.mjs";
import { renameMatchingPaths } from "./lib/rename-fs.mjs";
import { SWEDISH_TICKET_PAIRS } from "./lib/rename-swedish.mjs";
import { replacePairs, TICKET_PAIRS } from "./lib/rename-tokens.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_KEEP = [
  "packages/db/prisma/migrations",
  "tools/rename-ticket-to-order.mjs",
  "tools/rename-ticket-to-order.test.mjs",
  "tools/rename-run-sheet-to-run-sheet.mjs",
  "tools/rename-run-sheet-to-run-sheet.test.mjs",
  "tools/lib/rename-tokens.mjs",
  "tools/lib/rename-swedish.mjs",
  "tools/lib/rename-fs.mjs",
  "docs/decisions/0075-no-tickets-adrs-drive-work.md", // historical ADR on issue trackers
];

export function parseArgs({ argv = process.argv.slice(2) }) {
  const flags = {
    write: false,
    verify: false,
    allowDirty: false,
    root: ROOT,
    keep: [...DEFAULT_KEEP],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--write") flags.write = true;
    else if (arg === "--verify") flags.verify = true;
    else if (arg === "--allow-dirty") flags.allowDirty = true;
    else if (arg === "--root") flags.root = resolve(argv[++i]);
    else if (arg === "--keep") flags.keep.push(argv[++i]);
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node tools/rename-ticket-to-order.mjs [--write] [--verify] [--allow-dirty]");
      process.exit(0);
    }
  }

  return flags;
}

export function runTicketCodemod({ root = ROOT, write = false, keep = DEFAULT_KEEP }) {
  const { files, dirs } = walkWorkspace({ root, includeEnv: true, includeSelf: true, keep });
  const modifiedFiles = [];
  let totalReplacements = 0;

  for (const relPath of files) {
    const absPath = join(root, relPath);
    const buffer = readFileSync(absPath);
    if (isBinaryBuffer({ buffer })) continue;

    const originalText = buffer.toString("utf8");
    const isSwedish = relPath.includes("/sv/") || relPath.endsWith(".sv.json");
    const pairs = isSwedish
      ? [...SWEDISH_TICKET_PAIRS, ...TICKET_PAIRS]
      : TICKET_PAIRS;

    const { output, count, changed } = replacePairs({ text: originalText, pairs });
    if (!changed) continue;

    totalReplacements += count;
    modifiedFiles.push({ file: relPath, replacements: count });

    if (write) {
      writeFileSync(absPath, output, "utf8");
    }
  }

  const renamedPaths = renameMatchingPaths({
    root,
    files,
    dirs,
    pairs: TICKET_PAIRS,
    dryRun: !write,
  });

  return { modifiedFiles, totalReplacements, renamedPaths, write };
}

export function verifyTicketResidue({ root = ROOT, keep = DEFAULT_KEEP }) {
  const { files } = walkWorkspace({ root, includeEnv: true, includeSelf: true, keep });
  const residue = [];
  // Scan for lingering 'ticket' tokens (ignore comments or intentional mentions if any)
  const pattern = /\b(ticket|tickets|Ticket|Tickets)\b/;

  for (const relPath of files) {
    // Only check active code and messages
    if (relPath.startsWith("docs/") || relPath.endsWith(".md")) continue;
    const absPath = join(root, relPath);
    const buffer = readFileSync(absPath);
    if (isBinaryBuffer({ buffer })) continue;

    const lines = buffer.toString("utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (pattern.test(line)) {
        residue.push({ file: relPath, line: i + 1, content: line.trim() });
      }
    }
  }

  return residue;
}

async function main() {
  const flags = parseArgs({ argv: process.argv.slice(2) });

  if (flags.verify) {
    console.log("Scanning for Ticket residue in source code...");
    const residue = verifyTicketResidue({ root: flags.root, keep: flags.keep });
    if (residue.length === 0) {
      console.log("✓ Zero Ticket residue found in code!");
    } else {
      console.log(`Found ${residue.length} leftover Ticket occurrence(s):`);
      for (const item of residue.slice(0, 30)) {
        console.log(`  ${item.file}:${item.line}  ${item.content}`);
      }
      if (residue.length > 30) {
        console.log(`  ... and ${residue.length - 30} more.`);
      }
      process.exitCode = 1;
    }
    return;
  }

  console.log(`Running Ticket -> Order codemod (${flags.write ? "WRITE MODE" : "DRY RUN"})...`);
  const result = runTicketCodemod({ root: flags.root, write: flags.write, keep: flags.keep });

  console.log(`\nModified ${result.modifiedFiles.length} file(s) with ${result.totalReplacements} total replacement(s).`);
  console.log(`Renamed ${result.renamedPaths.length} path(s).`);

  if (!flags.write) {
    console.log("\nSample modified files:");
    for (const item of result.modifiedFiles.slice(0, 15)) {
      console.log(`  ${item.file} (${item.replacements} replacements)`);
    }
    console.log("\nSample renamed paths:");
    for (const item of result.renamedPaths.slice(0, 15)) {
      console.log(`  ${item.from} -> ${item.to}`);
    }
    console.log("\nRun with --write to apply changes.");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
