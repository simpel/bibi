import { createId } from "@paralleldrive/cuid2";
import {
  type Actor,
  createCoreOperations,
  createExecuteContext,
  type ExecuteContext,
  err,
  appError,
  ok,
  registerOperations,
} from "@okazi/core";
import { createGraphqlHandler } from "../src/index";
import { fakeEmbed } from "./fake-embed";

registerOperations({ operations: createCoreOperations({ embed: fakeEmbed }) });

export type TestContextInput = { organizationId?: string; roles?: string[]; actor?: Actor };

export function testContext({
  organizationId = `org_${createId()}`,
  roles = ["owner"],
  actor = { type: "user", userId: `user_${createId()}` },
}: TestContextInput = {}): ExecuteContext {
  return createExecuteContext({ organizationId, roles, actor });
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
  return async ({ query, variables }: { query: string; variables?: object }): Promise<GqlResponse> => {
    const request = new Request("http://localhost/graphql", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const response = await handler(request);
    return { status: response.status, body: await response.json() };
  };
}
