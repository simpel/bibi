#!/usr/bin/env node
// Language check for Okazi. Run with `pnpm check:language` from the repo root.
// Everything is written in English (ADR 0009). Swedish is allowed only in
// translations (packages/i18n/messages) and in tests that exercise Swedish text.
// Detection is heuristic: a line is flagged when it has a lowercase word with
// å, ä or ö, or a common Swedish word. Capitalised words are treated as proper
// nouns (place and company names). Lines between `sv-ok:start` and `sv-ok:end`
// markers are skipped (e.g. a glossary table for translators).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXCLUDED = [
  /^packages\/i18n\/messages\//,
  /\.(test|spec)\.tsx?$/,
  /(^|\/)(test|e2e)\//,
  /pnpm-lock\.yaml$/,
  /\.(png|jpe?g|gif|ico|svg|woff2?|pdf)$/,
];

// A word starting lowercase that contains å, ä or ö.
const SWEDISH_WORD = /(?<![\p{L}-])\p{Ll}[\p{L}-]*[åäö][\p{L}-]*|(?<![\p{L}-])[åäö][\p{L}-]*/gu;
// Common Swedish words without å/ä/ö that never appear in English text.
const SWEDISH_STOPWORD =
  /(?<!\p{L})(och|inte|eller|ska|finns|eftersom|samt|enligt|alltid|aldrig)(?!\p{L})/gu;

// URLs keep their original slugs.
const URL = /https?:\/\/\S+/g;

export function findSwedish({ content }) {
  const hits = [];
  let allowed = false;
  content.split("\n").forEach((line, index) => {
    if (line.includes("sv-ok:start")) allowed = true;
    if (line.includes("sv-ok:end")) allowed = false;
    if (allowed) return;
    const text = line.replace(URL, "");
    const words = [...(text.match(SWEDISH_WORD) ?? []), ...(text.match(SWEDISH_STOPWORD) ?? [])];
    if (words.length > 0) hits.push({ line: index + 1, words });
  });
  return hits;
}

export function listFiles({ root }) {
  const output = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" });
  return output
    .split("\0")
    .filter(Boolean)
    .filter((path) => !EXCLUDED.some((pattern) => pattern.test(path)));
}

export function runLanguageCheck({ root }) {
  const problems = [];
  for (const file of listFiles({ root })) {
    let content;
    try {
      content = readFileSync(resolve(root, file), "utf8");
    } catch {
      continue;
    }
    for (const hit of findSwedish({ content })) problems.push({ file, ...hit });
  }
  return problems;
}

export function formatLanguageReport({ problems }) {
  if (problems.length === 0) return "Language check OK: no Swedish outside translations and tests.";
  const lines = [`Language check failed: ${problems.length} line(s) with Swedish text.`];
  for (const { file, line, words } of problems) {
    lines.push(`  ${file}:${line}  ${words.slice(0, 5).join(", ")}`);
  }
  lines.push("", "Write it in English, or move UI text to packages/i18n/messages (ADR 0009).");
  return lines.join("\n");
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = runLanguageCheck({ root: ROOT });
  const report = formatLanguageReport({ problems });
  if (problems.length > 0) {
    console.error(report);
    process.exitCode = 1;
  } else {
    console.log(report);
  }
}
