import { getEnv } from "@bibi/config";
import type { Db } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { OAUTH_SCOPES } from "../oauth-scopes";
import { FIRST_PARTY_CLIENTS } from "./clients";
import { linkMcpResource } from "./link-mcp-resource";

const CLIENT_NAME = "Bibi Web Assistant";

export type ProvisionAssistantClientInput = {
  db: Db;
  /** Defaults to `${WEB_ORIGIN}${redirectPath}`; registered only, never followed. */
  redirectUri?: string;
};

const defaultRedirectUri = (): string =>
  new URL(FIRST_PARTY_CLIENTS.assistant.redirectPath, getEnv().WEB_ORIGIN).toString();

/** The configured id, else the existing client's, else a new one (only `provision:oauth` gets here). */
async function resolveClientId({ db }: { db: Db }): Promise<string> {
  const configured = getEnv().WEB_OAUTH_CLIENT_ID;
  if (configured) return configured;
  const existing = await db.oauthClient.findFirst({ where: { name: CLIENT_NAME } });
  return existing?.clientId ?? `bibi-web-${createId()}`;
}

/**
 * Creates or updates the assistant's first-party OAuth client (ADR 0005, 0007, 0104): public,
 * PKCE, consent skipped, linked to the MCP resource. Idempotent, so the worker runs it on every
 * start and `provision:oauth` runs it locally. Returns the client id.
 */
export async function provisionAssistantClient({
  db,
  redirectUri = defaultRedirectUri(),
}: ProvisionAssistantClientInput): Promise<string> {
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
  await linkMcpResource({ db, clientId });
  return clientId;
}
