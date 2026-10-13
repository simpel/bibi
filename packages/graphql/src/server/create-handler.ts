import { createCoreOperations, createIndexingHook, type EmbedFn } from "@okazi/core";
import { costLimitPlugin } from "@escape.tech/graphql-armor-cost-limit";
import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
import { useDisableIntrospection } from "@graphql-yoga/plugin-disable-introspection";
import { createYoga } from "graphql-yoga";
import { schema } from "../schema/schema";
import { buildContext, type ResolveContext } from "./build-context";

export const MAX_DEPTH = 10;
export const MAX_COST = 5000;

export type CreateGraphqlHandlerInput = {
  resolveContext: ResolveContext;
  embed: EmbedFn;
  /** Dev mode: GraphiQL, introspection and unmasked errors. Defaults to false (production). */
  development?: boolean;
};

/** Framework-agnostic `Request -> Response`; mount it in a Next route handler or any server. */
export function createGraphqlHandler({
  resolveContext,
  embed,
  development = false,
}: CreateGraphqlHandlerInput): (request: Request) => Promise<Response> {
  const operations = createCoreOperations({ embed });
  const afterCommit = [createIndexingHook({ embed })];
  const yoga = createYoga({
    schema,
    graphqlEndpoint: "*",
    landingPage: false,
    graphiql: development,
    maskedErrors: !development,
    context: ({ request }) => buildContext({ request, resolveContext, operations, afterCommit }),
    plugins: [
      maxDepthPlugin({ n: MAX_DEPTH }),
      costLimitPlugin({ maxCost: MAX_COST }),
      ...(development ? [] : [useDisableIntrospection()]),
    ],
  });
  return (request) => Promise.resolve(yoga.fetch(request));
}
