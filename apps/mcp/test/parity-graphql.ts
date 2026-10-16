import { type ExecuteContext, ok } from "@okazi/core";
import { createGraphqlHandler } from "@okazi/graphql";
import { fakeEmbed } from "./fake-embed";
import type { Json } from "./helpers";

export type GqlQueryInput = { context: ExecuteContext; query: string; variables?: Json };

export type GqlBody = { data?: Json; errors?: { extensions?: { code?: string } }[] };

/** Runs any query or mutation through the real GraphQL handler as `context`. */
export async function gqlRequest({ context, query, variables }: GqlQueryInput): Promise<GqlBody> {
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
  return (await response.json()) as GqlBody;
}

/** Runs any read query through the real GraphQL handler as `context`; throws on errors. */
export async function gqlQuery({ context, query, variables }: GqlQueryInput): Promise<Json> {
  const body = await gqlRequest({ context, query, variables });
  if (body.errors) throw new Error(`GraphQL: ${JSON.stringify(body.errors)}`);
  return body.data;
}
