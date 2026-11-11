import { resolve } from "node:path";
import { linkMcpResource, mcpResourceUrl, OAUTH_SCOPES } from "@bibi/auth";
import { getEnv } from "@bibi/config";
import { type Db, getDb } from "@bibi/db";
import nextEnv from "@next/env";
import { createId } from "@paralleldrive/cuid2";

/**
 * Provisions the first-party OAuth client the web assistant uses against MCP (ADR 0005/0007, 0104):
 * public client, PKCE, consent skipped, linked to the MCP resource. Idempotent: re-running
 * updates the redirect URI. Prints `WEB_OAUTH_CLIENT_ID=...` for `.env`.
 *
 *   pnpm --filter @bibi/web provision:oauth [--redirect-uri <url>]
 *
 * The redirect URI (default `${WEB_URL}/api/assistant/oauth/callback`) only has to be registered:
 * `getFirstPartyAccessToken` runs authorization code + PKCE in-process and reads the code from
 * the authorize response, so the redirect is never followed and no callback route exists.
 */
const CLIENT_NAME = "Bibi Web Assistant";

type ProvisionInput = { db: Db; redirectUri: string };

const parseRedirectUri = ({ args }: { args: string[] }): string => {
  const flag = args.indexOf("--redirect-uri");
  const given = flag >= 0 ? args[flag + 1] : undefined;
  return given ?? new URL("/api/assistant/oauth/callback", getEnv().WEB_URL).toString();
};

const resolveClientId = async ({ db }: { db: Db }): Promise<string> => {
  const configured = getEnv().WEB_OAUTH_CLIENT_ID;
  if (configured) return configured;
  const existing = await db.oauthClient.findFirst({ where: { name: CLIENT_NAME } });
  return existing?.clientId ?? `bibi-web-${createId()}`;
};

const upsertClient = async ({ db, redirectUri }: ProvisionInput): Promise<string> => {
  const clientId = await resolveClientId({ db });
  const now = new Date();
  const data = {
    name: CLIENT_NAME,
    redirectUris: [redirectUri],
    tokenEndpointAuthMethod: "none",
    grantTypes: ["authorization_code", "refresh_token"],
    responseTypes: ["code"],
    scopes: OAUTH_SCOPES,
    skipConsent: true,
    requirePKCE: true,
    updatedAt: now,
  };
  await db.oauthClient.upsert({
    where: { clientId },
    update: data,
    create: { id: createId(), clientId, createdAt: now, ...data },
  });
  return clientId;
};

async function main(): Promise<void> {
  nextEnv.loadEnvConfig(resolve(import.meta.dirname, "../../.."));
  const db = getDb();
  const redirectUri = parseRedirectUri({ args: process.argv.slice(2) });
  const clientId = await upsertClient({ db, redirectUri });
  await linkMcpResource({ db, clientId });
  console.log(
    `Provisioned "${CLIENT_NAME}" (redirect ${redirectUri}, resource ${mcpResourceUrl()})`,
  );
  console.log(`WEB_OAUTH_CLIENT_ID=${clientId}`);
  await db.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
