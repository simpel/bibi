import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export type RepoRootInput = { from: string };

/**
 * The monorepo root (the folder with `pnpm-workspace.yaml`) at or above `from`, so a relative
 * `STORAGE_DISK_DIR` means the same folder for web, MCP and the CLI. Falls back to `from`.
 */
export function repoRoot({ from }: RepoRootInput): string {
  let dir = from;
  while (!existsSync(join(dir, "pnpm-workspace.yaml"))) {
    const parent = dirname(dir);
    if (parent === dir) return from;
    dir = parent;
  }
  return dir;
}
