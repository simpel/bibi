import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

const rootEnvFile = new URL("../../../.env", import.meta.url);

/**
 * Loads the repo-root `.env` into `process.env` for tools that do not read it themselves
 * (Vitest, Prisma). Variables already set win, so CI env stays authoritative. In a git
 * worktree this is that worktree's `.env`, which points at its own database.
 */
export function loadRootEnv(): void {
  if (existsSync(rootEnvFile)) {
    loadEnvFile(rootEnvFile);
  }
}
