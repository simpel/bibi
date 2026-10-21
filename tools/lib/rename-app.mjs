// Core logic for the generic app-rename codemod (tools/rename-app.mjs).
import { lstatSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { DEFAULT_KEEP, isBinaryBuffer, walkWorkspace } from "./rename-app-walk.mjs";

function toVariants({ value }) {
  const lower = value.toLowerCase();
  const upper = value.toUpperCase();
  const title = lower.length > 0 ? lower[0].toUpperCase() + lower.slice(1) : "";
  return { lower, upper, title };
}

export function buildReplacer({ from, to, fromPrefix, toPrefix }) {
  const pairs = [{ from: toVariants({ value: from }), to: toVariants({ value: to }) }];
  if (fromPrefix && toPrefix) {
    pairs.push({ from: toVariants({ value: fromPrefix }), to: toVariants({ value: toPrefix }) });
  }
  pairs.sort((a, b) => b.from.lower.length - a.from.lower.length);
  const escaped = pairs.map((p) => p.from.lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return { pairs, pattern: new RegExp(escaped.join("|"), "gi") };
}

export function replaceText({ text, replacer }) {
  let count = 0;
  const output = text.replace(replacer.pattern, (match) => {
    const pair = replacer.pairs.find((p) => p.from.lower === match.toLowerCase());
    if (!pair) return match;
    count++;
    if (match === pair.from.upper) return pair.to.upper;
    if (match === pair.from.title) return pair.to.title;
    if (match[0] && match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
      return pair.to.title;
    }
    return pair.to.lower;
  });
  return { output, count, changed: output !== text };
}

function renameMatchingPaths({ root, files, dirs, replacer, dryRun }) {
  const renamed = [];
  const allRelPaths = [...files, ...dirs].sort((a, b) => b.length - a.length);
  for (const relPath of allRelPaths) {
    const currentAbs = join(root, relPath);
    const { output: nextBase, changed } = replaceText({ text: basename(currentAbs), replacer });
    if (!changed) continue;
    const parentRel = dirname(relPath);
    const nextRel = (parentRel === "." ? nextBase : `${parentRel}/${nextBase}`)
      .split(sep)
      .join("/");
    renamed.push({ from: relPath, to: nextRel });
    if (!dryRun && lstatSync(currentAbs, { throwIfNoEntry: false })) {
      renameSync(currentAbs, join(dirname(currentAbs), nextBase));
    }
  }
  return renamed;
}

function maybeRenameRoot({ root, replacer, renameRoot, dryRun }) {
  const resolvedRoot = resolve(root);
  const { output: nextBase, changed } = replaceText({ text: basename(resolvedRoot), replacer });
  if (!changed) return null;
  const target = join(dirname(resolvedRoot), nextBase);
  if (renameRoot && !dryRun) renameSync(resolvedRoot, target);
  return { from: resolvedRoot, to: target, applied: Boolean(renameRoot && !dryRun) };
}

export function applyCodemod({
  root,
  from,
  to,
  fromPrefix = "",
  toPrefix = "",
  dryRun = true,
  includeEnv = true,
  includeSelf = false,
  keep = DEFAULT_KEEP,
  renameRoot = false,
}) {
  const replacer = buildReplacer({ from, to, fromPrefix, toPrefix });
  const { files, dirs } = walkWorkspace({ root, includeEnv, includeSelf, keep });
  const modifiedFiles = [];
  let totalReplacements = 0;
  for (const relPath of files) {
    const absPath = join(root, relPath);
    const buffer = readFileSync(absPath);
    if (isBinaryBuffer({ buffer })) continue;
    const { output, count, changed } = replaceText({ text: buffer.toString("utf8"), replacer });
    if (!changed) continue;
    totalReplacements += count;
    modifiedFiles.push({ file: relPath, replacements: count });
    if (!dryRun) writeFileSync(absPath, output, "utf8");
  }
  const renamedPaths = renameMatchingPaths({ root, files, dirs, replacer, dryRun });
  const rootRename = maybeRenameRoot({ root, replacer, renameRoot, dryRun });
  return { modifiedFiles, totalReplacements, renamedPaths, rootRename, dryRun };
}
