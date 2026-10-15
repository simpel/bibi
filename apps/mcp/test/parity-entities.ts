import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { ExecuteContext } from "@okazi/core";
import { call, type Json } from "./helpers";
import { accessEntities } from "./parity-entities-access";
import { bookingEntities } from "./parity-entities-booking";
import { configurationEntities } from "./parity-entities-config";
import { customerEntities } from "./parity-entities-customer";
import { paymentAccountEntity, paymentEntity } from "./parity-entities-payment";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

export type EntityReadInput = {
  context: ExecuteContext;
  mcp: Client;
  created: Json;
  keys: string[];
};
export type CreateInput = { mcp: Client; made: Record<string, Json> };

/** One core entity: how to create it (MCP, as the user) and read it back through each surface. */
export type ParityEntity = {
  name: string;
  create: (input: CreateInput) => Promise<Json>;
  viaMcp: (input: EntityReadInput) => Promise<Json>;
  viaRest: (input: EntityReadInput) => Promise<Json>;
  viaGraph: (input: EntityReadInput) => Promise<Json>;
};

type ByIdInput = {
  name: string;
  field: string;
  list: string;
  createTool: string;
  args: CreateInput["made"];
  /** GraphQL sub-selection per key for nested objects, e.g. `{ values: "{ id name }" }`. */
  nested?: Record<string, string>;
};

export const tool = async ({ mcp, name, args }: { mcp: Client; name: string; args: Json }) =>
  (await call({ client: mcp, name, args })).data;

/** Entities with `<entity>_get`, `GET /<list>/{id}` and `<field>(id:)`. */
export function byId({
  name,
  field,
  list,
  createTool,
  args,
  nested = {},
}: ByIdInput): ParityEntity {
  return {
    name,
    create: ({ mcp, made }) => tool({ mcp, name: createTool, args: { ...args, ...made } }),
    viaMcp: ({ mcp, created }) => tool({ mcp, name: `${name}_get`, args: { id: created.id } }),
    viaRest: ({ context, created }) =>
      createRestClient({ context }).get({ path: `/${list}/${created.id}` }),
    viaGraph: async ({ context, created, keys }) => {
      const selection = keys.map((key) => `${key} ${nested[key] ?? ""}`.trim()).join(" ");
      const query = `query($id: String!) { ${field}(id: $id) { ${selection} } }`;
      return (await gqlQuery({ context, query, variables: { id: created.id } }))[field];
    },
  };
}

const message: ParityEntity = {
  name: "message",
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "message_append",
      args: {
        conversationId: made.conversation.id,
        role: "USER",
        parts: [{ type: "text", text: "Hej" }],
      },
    }),
  viaMcp: async ({ mcp, created }) =>
    (await tool({ mcp, name: "message_list", args: { conversationId: created.conversationId } }))
      .items[0],
  viaRest: async ({ context, created }) =>
    (
      await createRestClient({ context }).get({
        path: `/conversations/${created.conversationId}/messages`,
      })
    ).items[0],
  viaGraph: async ({ context, created, keys }) => {
    const query = `query($id: String!) { conversation(id: $id) { messages { ${keys.join(" ")} } } }`;
    const data = await gqlQuery({ context, query, variables: { id: created.conversationId } });
    return data.conversation.messages[0];
  },
};

/** Entity types in creation order; add a row when a new entity gets core operations. */
export const ENTITIES: ParityEntity[] = [
  byId({
    name: "venue",
    field: "venue",
    list: "venues",
    createTool: "venue_create",
    args: { name: "Parity Hall" },
  }),
  ...configurationEntities(),
  ...customerEntities(),
  byId({
    name: "bookingStatus",
    field: "bookingStatus",
    list: "booking-statuses",
    createTool: "bookingStatus_create",
    args: { name: "Parity status", color: "#22c55e", phase: "TENTATIVE" },
  }),
  ...bookingEntities(),
  byId({
    name: "conversation",
    field: "conversation",
    list: "conversations",
    createTool: "conversation_create",
    args: { title: "Parity chat" },
  }),
  message,
  byId({
    name: "skill",
    field: "skill",
    list: "skills",
    createTool: "skill_create",
    args: {
      name: "Parity skill",
      description: "Parity",
      instructions: "# Steps",
      allowedTools: ["search"],
      resources: [{ name: "a.md", content: "x" }],
    },
  }),
  ...accessEntities(),
  paymentAccountEntity,
  paymentEntity(),
];
