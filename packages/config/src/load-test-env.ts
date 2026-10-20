// Package self-reference: Node loads this config file natively and needs a resolvable specifier.
import { loadRootEnv } from "@okazi/config/load-root-env";
import { testDatabaseUrl } from "@okazi/config/test-database-url";

/**
 * Environment for Vitest: the root `.env`, with `DATABASE_URL` pointed at the test database
 * (`TEST_DATABASE_URL`, else `<db>_test`, created and migrated by `pnpm test:db`) so tests never
 * write into the dev database, and the AI Gateway key blanked so tests never call a paid model or
 * embedder. An empty key selects the deterministic placeholder embedder. Call it at the top of
 * every `vitest.config.ts`.
 */
export function loadTestEnv(): void {
  loadRootEnv();
  const url = testDatabaseUrl({
    databaseUrl: process.env.DATABASE_URL,
    testDatabaseUrl: process.env.TEST_DATABASE_URL,
  });
  if (url) process.env.DATABASE_URL = url;
  process.env.AI_GATEWAY_API_KEY = "";
}
