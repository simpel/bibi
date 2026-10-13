import { type ExecuteContext, ok } from "@okazi/core";
import { createGraphqlHandler } from "@okazi/graphql";
import { fakeEmbed } from "./fake-embed";
import type { Json } from "./helpers";

export type GqlReadInput = { context: ExecuteContext; entity: string; id: string; keys: string[] };

/** Reads `<entity>(id:)` through the real GraphQL handler, selecting the given fields. */
export async function gqlRead({ context, entity, id, keys }: GqlReadInput): Promise<Json> {
  const handler = createGraphqlHandler({
    embed: fakeEmbed,
    resolveContext: async () => ok({ value: context }),
  });
  const query = `query($id: String!) { ${entity}(id: $id) { ${keys.join(" ")} } }`;
  const response = await handler(
    new Request("http://localhost/graphql", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query, variables: { id } }),
    }),
  );
  const body = (await response.json()) as { data?: Json; errors?: unknown[] };
  if (body.errors) throw new Error(`GraphQL ${entity}: ${JSON.stringify(body.errors)}`);
  return body.data[entity];
}
