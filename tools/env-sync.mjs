#!/usr/bin/env node
// Keeps .env in step with .exampleenv: the same keys, no more and no less, in the same order.
// Values in .env are kept; a key missing from .env gets the example's default (or stays a comment
// when the example comments it out). Keys only in .env are removed, after a backup to .env.bak.
//   pnpm env:check   exits 1 and lists the differences (key names only, never values)
//   pnpm env:sync    rewrites .env to match
// Usage: node tools/env-sync.mjs [--check] [--file <path>] [--example <path>]
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const KEY_LINE = /^\s*(#\s*)?([A-Z][A-Z0-9_]*)=(.*)$/;

/** Reads `KEY=value` lines (commented ones skipped) into an ordered map. */
function readValues({ text }) {
  const values = new Map();
  for (const line of text.split("\n")) {
    const match = KEY_LINE.exec(line);
    if (match && !match[1]) values.set(match[2], match[3]);
  }
  return values;
}

/** Every key the example names, commented or not, in file order. */
function exampleKeys({ text }) {
  return text
    .split("\n")
    .map((line) => KEY_LINE.exec(line))
    .filter(Boolean)
    .map((match) => match[2]);
}

/** The example's lines with this .env's values filled in. */
function render({ exampleText, values }) {
  const lines = exampleText.split("\n").map((line) => {
    const match = KEY_LINE.exec(line);
    if (!match) return line;
    const key = match[2];
    return values.has(key) ? `${key}=${values.get(key)}` : line;
  });
  return lines.join("\n");
}

function parseArgs({ argv }) {
  const args = { check: false, file: ".env", example: ".exampleenv" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--check") args.check = true;
    else if (argv[i] === "--file") args.file = argv[++i];
    else if (argv[i] === "--example") args.example = argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs({ argv: process.argv.slice(2) });
  const examplePath = resolve(args.example);
  const envPath = resolve(args.file);
  const exampleText = readFileSync(examplePath, "utf8");
  const envText = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const values = readValues({ text: envText });
  const wanted = new Set(exampleKeys({ text: exampleText }));
  const extra = [...values.keys()].filter((key) => !wanted.has(key));
  const next = render({ exampleText, values });
  const missing = [...readValues({ text: next }).keys()].filter((key) => !values.has(key));

  if (next === envText) {
    console.log(`✓ ${args.file} matches ${args.example}.`);
    return;
  }
  if (extra.length) console.log(`Not in ${args.example} (removed): ${extra.join(", ")}`);
  if (missing.length)
    console.log(`Missing (added with the example's default): ${missing.join(", ")}`);
  if (!extra.length && !missing.length) console.log("Order or layout differs.");
  if (args.check) {
    console.log(`✗ ${args.file} differs from ${args.example}. Run: pnpm env:sync`);
    process.exitCode = 1;
    return;
  }
  if (envText) copyFileSync(envPath, `${envPath}.bak`);
  writeFileSync(envPath, next);
  console.log(`✓ Rewrote ${args.file}${envText ? ` (previous copy: ${args.file}.bak)` : ""}.`);
}

main();
