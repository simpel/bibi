import { resolve } from "node:path";
import { mcpResourceUrl, provisionAssistantClient } from "@bibi/auth";
import { getDb } from "@bibi/db";
import nextEnv from "@next/env";

/**
 * Provisions the assistant's first-party OAuth client locally (`provisionAssistantClient` in
 * `@bibi/auth`; the worker runs the same on start in production when `WEB_OAUTH_CLIENT_ID` is
 * set). Idempotent: re-running updates the redirect URI. Prints `WEB_OAUTH_CLIENT_ID=...` for `.env`.
 *
 *   pnpm --filter @bibi/web provision:oauth [--redirect-uri <url>]
 *
 * The redirect URI (default `${WEB_ORIGIN}/api/assistant/oauth/callback`) only has to be registered:
 * the code is read from the authorize response in-process, so the redirect is never followed.
 */
const parseRedirectUri = ({ args }: { args: string[] }): string | undefined => {
  const flag = args.indexOf("--redirect-uri");
  return flag >= 0 ? args[flag + 1] : undefined;
};

async function main(): Promise<void> {
  nextEnv.loadEnvConfig(resolve(import.meta.dirname, "../../.."));
  const db = getDb();
  const redirectUri = parseRedirectUri({ args: process.argv.slice(2) });
  const clientId = await provisionAssistantClient({ db, ...(redirectUri ? { redirectUri } : {}) });
  console.log(`Provisioned the assistant's OAuth client (resource ${mcpResourceUrl()})`);
  console.log(`WEB_OAUTH_CLIENT_ID=${clientId}`);
  await db.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
