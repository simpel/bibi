// Workspace walk for the app-rename codemod: which files and folders it may touch.
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  ".turbo",
  "storybook-static",
  "playwright-report",
  "test-results",
  "coverage",
  "generated",
]);

export const SELF_FILES = new Set([
  "tools/app-name.json",
  "tools/rename-app.mjs",
  "tools/lib/rename-app-config.mjs",
  "tools/rename-app-config.test.mjs",
  "tools/lib/rename-app.mjs",
  "tools/lib/rename-app-walk.mjs",
  "tools/lib/rename-app-guards.mjs",
  "tools/lib/rename-app-report.mjs",
  "tools/rename-app.test.mjs",
  "tools/rename-app-guards.test.mjs",
]);

// Applied migrations are checksummed by Prisma; editing one breaks `migrate dev`.
export const DEFAULT_KEEP = ["packages/db/prisma/migrations"];

const ENV_FILES = new Set([".env", ".env.local", ".env.tmp"]);

export function isKept({ relPath, keep }) {
  return keep.some((entry) => {
    const prefix = entry.replace(/\/+$/, "");
    return relPath === prefix || relPath.startsWith(`${prefix}/`);
  });
}

export function isBinaryBuffer({ buffer }) {
  const limit = Math.min(buffer.length, 8000);
  for (let i = 0; i < limit; i++) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

function isSkippedFile({ name, relPath, includeEnv, includeSelf }) {
  if (name === ".DS_Store" || name.endsWith(".tsbuildinfo")) return true;
  if (!includeEnv && ENV_FILES.has(name)) return true;
  return !includeSelf && SELF_FILES.has(relPath);
}

export function walkWorkspace({ root, includeEnv = true, includeSelf = false, keep = [] }) {
  const files = [];
  const dirs = [];
  function visit({ dir }) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      // A worktree's `.git` is a file holding an absolute gitdir path: never touch it.
      if (entry.name === ".git" || entry.isSymbolicLink()) continue;
      const absPath = join(dir, entry.name);
      const relPath = relative(root, absPath).split(sep).join("/");
      if (isKept({ relPath, keep })) continue;
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        visit({ dir: absPath });
        dirs.push(relPath);
      } else if (entry.isFile()) {
        if (isSkippedFile({ name: entry.name, relPath, includeEnv, includeSelf })) continue;
        files.push(relPath);
      }
    }
  }
  visit({ dir: root });
  return { files, dirs };
}
