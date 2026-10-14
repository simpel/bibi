// Package self-reference: Node loads this config file natively and needs a resolvable specifier.
import { loadRootEnv } from "@okazi/config/load-root-env";

/**
 * Environment for Vitest: the root `.env` (a worktree's own database in a worktree), with the
 * AI Gateway key blanked so tests never call a paid model or embedder. An empty key selects the
 * deterministic placeholder embedder. Call it at the top of every `vitest.config.ts`.
 */
export function loadTestEnv(): void {
  loadRootEnv();
  process.env.AI_GATEWAY_API_KEY = "";
}
