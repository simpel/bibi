import { getEnv } from "@bibi/config";
import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { mcpResourceUrl, OAUTH_SCOPES, provisionAssistantClient } from "../src/index";

describe("provisionAssistantClient", () => {
  it("creates the configured client, PKCE and consent skipped, linked to MCP", async () => {
    const db = getDb();
    const clientId = await provisionAssistantClient({ db });

    expect(clientId).toBe(getEnv().WEB_OAUTH_CLIENT_ID);
    const client = await db.oauthClient.findUniqueOrThrow({ where: { clientId } });
    expect(client).toMatchObject({
      redirectUris: [new URL("/api/assistant/oauth/callback", getEnv().WEB_ORIGIN).toString()],
      tokenEndpointAuthMethod: "none",
      scopes: OAUTH_SCOPES,
      skipConsent: true,
      requirePKCE: true,
    });
    const link = await db.oauthClientResource.findFirst({
      where: { clientId, resourceId: mcpResourceUrl() },
    });
    expect(link).not.toBeNull();
  });

  it("is idempotent and updates the redirect URI on a rerun", async () => {
    const db = getDb();
    await provisionAssistantClient({ db });
    const redirectUri = "https://app.example.test/api/assistant/oauth/callback";
    const clientId = await provisionAssistantClient({ db, redirectUri });

    const clients = await db.oauthClient.findMany({ where: { clientId } });
    expect(clients).toHaveLength(1);
    expect(clients[0]?.redirectUris).toEqual([redirectUri]);
  });
});
