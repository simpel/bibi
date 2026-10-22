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

/** API keys and OAuth grants (ADR 0005). */
export function integrationEntities(): ParityEntity[] {
  return [
    apiKey,
    listed({
      name: "oauthGrant",
      path: "/oauth-grants",
      field: "oauthGrants",
      create: connectClient,
    }),
  ];
}
