import { type ExecuteContext, ok } from "@okazi/core";
import { createGraphqlHandler } from "@okazi/graphql";
import { fakeEmbed } from "./fake-embed";
import type { Json } from "./helpers";

export type GqlQueryInput = { context: ExecuteContext; query: string; variables?: Json };

/** Runs any read query through the real GraphQL handler as `context`; throws on errors. */
export async function gqlQuery({ context, query, variables }: GqlQueryInput): Promise<Json> {
  const handler = createGraphqlHandler({
    embed: fakeEmbed,
    resolveContext: async () => ok({ value: context }),
  });
  const response = await handler(
    new Request("http://localhost/graphql", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query, variables }),
    }),
  );
  const body = (await response.json()) as { data?: Json; errors?: unknown[] };
  if (body.errors) throw new Error(`GraphQL: ${JSON.stringify(body.errors)}`);
  return body.data;
}
