// Filesystem walk and path renaming for domain rename codemods.
import { lstatSync, renameSync } from "node:fs";
import { basename, dirname, join, sep } from "node:path";
import { replacePairs } from "./rename-tokens.mjs";

export function renameMatchingPaths({ root, files, dirs, pairs, dryRun }) {
  const renamed = [];
  // Sort descending by depth/length so leaf files and deepest directories are renamed first
  const allRelPaths = [...files, ...dirs].sort((a, b) => {
    const depthA = a.split("/").length;
    const depthB = b.split("/").length;
    if (depthB !== depthA) return depthB - depthA;
    return b.length - a.length;
  });

  for (const relPath of allRelPaths) {
    const currentAbs = join(root, relPath);
    const originalBase = basename(currentAbs);
    const { output: nextBase, changed } = replacePairs({ text: originalBase, pairs });
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
