// Package self-reference: Node loads this config file natively and needs a resolvable specifier.
import { loadRootEnv } from "@bibi/config/load-root-env";
import { testDatabaseUrl } from "@bibi/config/test-database-url";

/**
 * Environment for Vitest: the root `.env`, with `DATABASE_URL` pointed at the test database
 * (`TEST_DATABASE_URL`, else `<db>_test`, created and migrated by `pnpm test:db`) so tests never
 * write into the dev database, and the AI Gateway key blanked so tests never call a paid model or
 * embedder. An empty key selects the deterministic placeholder embedder. Provider app keys are
 * blanked too, so a local `.env` with sandbox keys never makes a test call Stripe, Fortnox or
 * Visma (tests install memory providers or set keys in their own `vitest.config.ts`). Call it at
 * the top of every `vitest.config.ts`.
 */
const BLANKED = [
  "AI_GATEWAY_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_PLATFORM_ACCOUNT_ID",
  "STRIPE_WEBHOOK_SECRET",
  "FORTNOX_CLIENT_ID",
  "FORTNOX_CLIENT_SECRET",
  "VISMA_CLIENT_ID",
  "VISMA_CLIENT_SECRET",
];

export function loadTestEnv(): void {
  loadRootEnv();
  const url = testDatabaseUrl({
    databaseUrl: process.env.DATABASE_URL,
    testDatabaseUrl: process.env.TEST_DATABASE_URL,
  });
  if (url) process.env.DATABASE_URL = url;
  for (const key of BLANKED) process.env[key] = "";
}
