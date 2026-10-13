import { createCoreOperations, createIndexingHook, type EmbedFn } from "@okazi/core";
import { useDisableIntrospection } from "@graphql-yoga/plugin-disable-introspection";
import { createYoga, type Plugin } from "graphql-yoga";
import { costLimitRule } from "../limits/cost-limit";
import { depthLimitRule } from "../limits/depth-limit";
import { schema } from "../schema/schema";
import { buildContext, type ResolveContext } from "./build-context";

export const MAX_DEPTH = 10;
export const MAX_COST = 25_000;

const limitsPlugin: Plugin = {
  onValidate({ addValidationRule }) {
    addValidationRule(depthLimitRule({ maxDepth: MAX_DEPTH }));
    addValidationRule(costLimitRule({ maxCost: MAX_COST }));
  },
};

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
      limitsPlugin,
      ...(development ? [] : [useDisableIntrospection()]),
    ],
  });
  return (request) => Promise.resolve(yoga.fetch(request));
}
