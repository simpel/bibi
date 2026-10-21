// Safety checks for the app-rename codemod: a clean git tree before writing, residue after.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { isBinaryBuffer, isKept, SELF_FILES, walkWorkspace } from "./rename-app-walk.mjs";

export function checkCleanTree({ root }) {
  let status;
  try {
    status = execFileSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return {
      ok: false,
      reason: "not a git repository, so the rename could not be reviewed or reverted",
    };
  }
  const dirty = status.split("\n").filter(Boolean);
  if (dirty.length === 0) return { ok: true, dirty };
  return {
    ok: false,
    reason: `${dirty.length} uncommitted change(s); commit or stash them first`,
    dirty,
  };
}

function contentHits({ root, relPath, pattern, handled }) {
  const buffer = readFileSync(join(root, relPath));
  const binary = isBinaryBuffer({ buffer });
  // A text file the codemod rewrites has every match replaced, so a dry run can skip it.
  if (handled && !binary) return [];
  if (binary)
    return pattern.test(buffer.toString("latin1")) ? [{ path: relPath, kind: "binary" }] : [];
  const hits = [];
  buffer
    .toString("utf8")
    .split("\n")
    .forEach((line, index) => {
      if (pattern.test(line)) {
        hits.push({
          path: relPath,
          kind: "content",
          line: index + 1,
          text: line.trim().slice(0, 160),
        });
      }
    });
  return hits;
}

// Lists every place the old name is left. With `assumeApplied` (a dry run) it skips what the
// codemod would rewrite, so the result predicts the residue of a real run.
export function findResidue({
  root,
  replacer,
  includeEnv = true,
  includeSelf = false,
  keep = [],
  assumeApplied = false,
}) {
  const pattern = new RegExp(replacer.pattern.source, "i");
  const handled = assumeApplied
    ? walkWorkspace({ root, includeEnv, includeSelf, keep })
    : { files: [], dirs: [] };
  const handledSet = new Set([...handled.files, ...handled.dirs]);
  const all = walkWorkspace({ root, includeEnv: true, includeSelf: true });
  const hits = [];
  for (const relPath of [...all.files, ...all.dirs]) {
    if (!handledSet.has(relPath) && pattern.test(basename(relPath))) {
      hits.push({ path: relPath, kind: "name" });
    }
  }
  for (const relPath of all.files) {
    hits.push(...contentHits({ root, relPath, pattern, handled: handledSet.has(relPath) }));
  }
  const isAllowed = (path) =>
    isKept({ relPath: path, keep }) || (!includeSelf && SELF_FILES.has(path));
  return {
    residue: hits.filter((hit) => !isAllowed(hit.path)),
    kept: hits.filter((hit) => isAllowed(hit.path)),
  };
}
