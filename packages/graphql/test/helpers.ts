import {
  type Actor,
  appError,
  createCoreOperations,
  createExecuteContext,
  type ExecuteContext,
  err,
  ok,
  type PermissionSet,
  PRESET_PERMISSIONS,
  registerOperations,
} from "@okazi/core";
import { createId } from "@paralleldrive/cuid2";
import { createGraphqlHandler } from "../src/index";
import { fakeEmbed } from "./fake-embed";

registerOperations({ operations: createCoreOperations({ embed: fakeEmbed }) });

/** Shorthand for a preset (ADR 0050): read → member, write → manager, admin → admin. */
const PRESET_FOR_ACCESS = { read: "member", write: "manager", admin: "admin" } as const;
export type TestAccess = keyof typeof PRESET_FOR_ACCESS;

export type TestContextInput = {
  organizationId?: string;
  /** The preset's permissions (default `admin`), or explicit `permissions`. */
  access?: TestAccess;
  permissions?: PermissionSet;
  actor?: Actor;
};

export function testContext({
  organizationId = `org_${createId()}`,
  access = "admin",
  permissions = PRESET_PERMISSIONS[PRESET_FOR_ACCESS[access]],
  actor = { type: "user", userId: `user_${createId()}` },
}: TestContextInput = {}): ExecuteContext {
  return createExecuteContext({
    organizationId,
    roles: [PRESET_FOR_ACCESS[access]],
    permissions,
    actor,
  });
}

export type GqlResponse = {
  status: number;
  // biome-ignore lint/suspicious/noExplicitAny: test-only access to arbitrary JSON
  body: { data?: any; errors?: { message: string; extensions?: any }[] };
};

export type TestClientInput = { context?: ExecuteContext; development?: boolean };

/** Handler whose caller is always `context`; no context → UNAUTHENTICATED. */
export function createClient({ context, development }: TestClientInput = {}) {
  const handler = createGraphqlHandler({
    embed: fakeEmbed,
    ...(development !== undefined ? { development } : {}),
    resolveContext: async () =>
      context
        ? ok({ value: context })
        : err({ error: appError({ code: "UNAUTHENTICATED", message: "Sign in required" }) }),
  });
  return async ({
    query,
    variables,
  }: {
    query: string;
    variables?: object;
  }): Promise<GqlResponse> => {
    const request = new Request("http://localhost/graphql", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const response = await handler(request);
    return { status: response.status, body: await response.json() };
  };
}

export type CreateItemTypeInput = { gql: ReturnType<typeof createClient>; name?: string };

const CREATE_TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;

/** Creates a bookable, priced ITEM type with setups and returns its id. */
export async function createItemType({ gql, name = "Konferensrum" }: CreateItemTypeInput) {
  const res = await gql({
    query: CREATE_TYPE,
    variables: { i: { base: "ITEM", name, capabilities: ["BOOKABLE", "SETUPS", "PRICED"] } },
  });
  return res.body.data.entityTypeCreate.id as string;
}
