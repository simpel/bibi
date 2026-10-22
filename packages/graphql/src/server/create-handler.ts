import {
  type AfterCommitHook,
  createCoreOperations,
  createIndexingHook,
  type EmbedFn,
} from "@bibi/core";
import { withRequestLogging } from "@bibi/logger";
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
  /** Run after search indexing once a mutation committed (e.g. the invitation mail). */
  afterCommit?: readonly AfterCommitHook[];
  /** Dev mode: GraphiQL, introspection and unmasked errors. Defaults to false (production). */
  development?: boolean;
};

/** Framework-agnostic `Request -> Response`; mount it in a Next route handler or any server. */
export function createGraphqlHandler({
  resolveContext,
  embed,
  afterCommit: extraHooks = [],
  development = false,
}: CreateGraphqlHandlerInput): (request: Request) => Promise<Response> {
  const operations = createCoreOperations({ embed });
  const afterCommit = [createIndexingHook({ embed }), ...extraHooks];
  const yoga = createYoga({
    schema,
    graphqlEndpoint: "*",
    landingPage: false,
    graphiql: development,
    maskedErrors: !development,
    context: ({ request }) => buildContext({ request, resolveContext, operations, afterCommit }),
    plugins: [limitsPlugin, ...(development ? [] : [useDisableIntrospection()])],
  });
  return withRequestLogging({
    surface: "graphql",
    handler: (request) => Promise.resolve(yoga.fetch(request)),
  });
}
