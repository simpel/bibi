import { randomBytes } from "node:crypto";
import { getEnv } from "@bibi/config";
import { createApiKey, execute } from "@bibi/core";
import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import type { Json } from "./helpers";
import { type CreateInput, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

type ListedInput = {
  name: string;
  /** REST list path and GraphQL list field, e.g. `/api-keys` and `apiKeys`. */
  path: string;
  field: string;
  create: ParityEntity["create"];
};

const byIdIn = ({ items, id }: { items: { id: string }[]; id: string }) =>
  items.find((item) => item.id === id);

/** Entities without a `get`: read back by finding the created id in each surface's list. */
function listed({ name, path, field, create }: ListedInput): ParityEntity {
  return {
    name,
    create,
    viaMcp: async ({ mcp, created }) =>
      byIdIn({
        items: (await tool({ mcp, name: `${name}_list`, args: {} })).items,
        id: created.id,
      }),
    viaRest: async ({ context, created }) =>
      byIdIn({ items: (await createRestClient({ context }).get({ path })).items, id: created.id }),
    viaGraph: async ({ context, created, keys }) => {
      const query = `query { ${field} { items { ${keys.join(" ")} } } }`;
      const data = await gqlQuery({ context, query, variables: {} });
      return byIdIn({ items: data[field].items, id: created.id });
    },
  };
}

/** A live refresh token for the caller, as Better Auth writes it after an MCP client's consent. */
async function connectClient({ context, mcp }: CreateInput): Promise<Json> {
  const db = getDb();
  const userId = context.actor.userId ?? "";
  const email = `${userId}@x.test`;
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, name: "P", email },
  });
  const clientId = `client_${createId()}`;
  const now = new Date();
  await db.oauthClient.create({
    data: { id: createId(), clientId, name: "Parity client", createdAt: now, updatedAt: now },
  });
  await db.oauthRefreshToken.create({
    data: {
      id: createId(),
      token: createId(),
      clientId,
      userId,
      referenceId: context.organizationId,
      scopes: ["openid"],
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      createdAt: now,
    },
  });
  return (await tool({ mcp, name: "oauthGrant_list", args: {} })).items[0];
}

/**
 * `apiKey.create` only accepts a web session (#90), which MCP never has: create the key through
 * core as a session caller, then read it back through every surface.
 */
async function createKey({ context }: CreateInput): Promise<Json> {
  const input = { name: "Parity", role: "manager" };
  const created = await execute({
    operation: createApiKey,
    input,
    context: { ...context, credential: "session" },
  });
  if (!created.ok) throw created.error;
  return JSON.parse(JSON.stringify(created.value.apiKey));
}

/** API keys have a `get` on every surface; read back by id. */
const apiKey: ParityEntity = {
  name: "apiKey",
  create: createKey,
  viaMcp: ({ mcp, created }) => tool({ mcp, name: "apiKey_get", args: { id: created.id } }),
  viaRest: ({ context, created }) =>
    createRestClient({ context }).get({ path: `/api-keys/${created.id}` }),
  viaGraph: async ({ context, created, keys }) => {
    const query = `query($id: String!) { apiKey(id: $id) { ${keys.join(" ")} } }`;
    return (await gqlQuery({ context, query, variables: { id: created.id } })).apiKey;
  },
};

/** Fortnox credentials and a sealing key, so `integration.connect` can start (it never calls Fortnox). */
function configureFortnox() {
  Object.assign(getEnv(), {
    FORTNOX_CLIENT_ID: "client-id",
    FORTNOX_CLIENT_SECRET: "client-secret",
    FORTNOX_AUTH_BASE_URL: "https://apps.fortnox.se",
    FORTNOX_API_BASE_URL: "https://api.fortnox.se",
    INTEGRATION_SECRET_KEY: randomBytes(32).toString("base64"),
  });
}

/** Starting the Fortnox connection creates the row; every surface lists it back by id. */
const integrationConnection: ParityEntity = {
  ...listed({
    name: "integrationConnection",
    path: "/integrations",
    field: "integrations",
    create: async ({ mcp }) => {
      configureFortnox();
      // One accounting system at a time (ADR 0108): another entity may have connected the memory
      // ledger (Visma) in this organization, so switch from it as a venue would.
      await tool({ mcp, name: "integration_disconnect", args: { provider: "VISMA" } });
      const started = await tool({
        mcp,
        name: "integration_connect",
        args: { provider: "FORTNOX" },
      });
      const { items } = await tool({ mcp, name: "integration_list", args: {} });
      return items.find((item: Json) => item.id === started.id);
    },
  }),
  viaMcp: async ({ mcp, created }) =>
    byIdIn({
      items: (await tool({ mcp, name: "integration_list", args: {} })).items,
      id: created.id,
    }),
};

/** API keys, OAuth grants (ADR 0005) and the Fortnox connection (ADR 0087). */
export function integrationEntities(): ParityEntity[] {
  return [
    apiKey,
    listed({
      name: "oauthGrant",
      path: "/oauth-grants",
      field: "oauthGrants",
      create: connectClient,
    }),
    integrationConnection,
  ];
}
