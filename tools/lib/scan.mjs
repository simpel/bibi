// File discovery for the structure check: which source files to inspect.
import { existsSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", ".turbo", "generated", "coverage"]);
const SOURCE_FILE = /\.tsx?$/;

// Generated code, declaration files, i18n messages and Prisma migrations are excluded.
export function isExcluded({ relPath }) {
  return (
    /\.d\.ts$/.test(relPath) ||
    /\.generated\./.test(relPath) ||
    relPath.startsWith("packages/i18n/messages/") ||
    /(^|\/)prisma\/migrations\//.test(relPath)
  );
}

export function walkSources({ dir, root }) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) found.push(...walkSources({ dir: absPath, root }));
      continue;
    }
    if (!SOURCE_FILE.test(entry.name)) continue;
    const relPath = relative(root, absPath).split(sep).join("/");
    if (!isExcluded({ relPath })) found.push(relPath);
  }
  return found;
}

// Packages in apps/* and packages/*, as relative paths (e.g. "packages/core").
export function listPackageDirs({ root }) {
  return ["apps", "packages"].flatMap((group) => {
    const groupDir = join(root, group);
    if (!existsSync(groupDir)) return [];
    return readdirSync(groupDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${group}/${entry.name}`);
  });
}
