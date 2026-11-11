import type { Db } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { OAUTH_SCOPES } from "../plugins/mcp";
import { mcpResourceUrl } from "../urls";

export type LinkMcpResourceInput = { db: Db; clientId: string };

/**
 * Registers the MCP resource (`${MCP_URL}/mcp`, ADR 0104) if missing and links the client to it, so
 * the client's tokens are audience-bound to MCP. Idempotent. Used by `provision:oauth` and tests.
 */
export async function linkMcpResource({ db, clientId }: LinkMcpResourceInput): Promise<void> {
  const resourceId = mcpResourceUrl();
  const now = new Date();
  const existing = await db.oauthResource.findFirst({ where: { identifier: resourceId } });
  if (!existing) {
    await db.oauthResource.create({
      data: {
        id: createId(),
        identifier: resourceId,
        name: "Bibi MCP",
        allowedScopes: OAUTH_SCOPES,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  await db.oauthClientResource.upsert({
    where: { clientId_resourceId: { clientId, resourceId } },
    update: {},
    create: { id: createId(), clientId, resourceId, createdAt: now },
  });
}
