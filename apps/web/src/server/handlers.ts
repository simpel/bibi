import "server-only";
import { createRestHandler } from "@bibi/api";
import { invitationMailHook, resolveExecuteContext } from "@bibi/auth";
import { createGraphqlHandler } from "@bibi/graphql";
import { embed } from "./embed";
import { ensureOperations } from "./operations";

type Handler = (request: Request) => Promise<Response>;

const holder = globalThis as typeof globalThis & {
  __bibiGraphql?: Handler;
  __bibiRest?: Handler;
};

/** `POST /api/graphql`: the graph for external callers (API key / OAuth / session). */
export function graphqlHandler(): Handler {
  holder.__bibiGraphql ??= createGraphqlHandler({
    resolveContext: resolveExecuteContext,
    embed,
    afterCommit: [invitationMailHook],
  });
  return holder.__bibiGraphql;
}

/** `/api/v1/*`: REST + OpenAPI derived from the registered core operations. */
export function restHandler(): Handler {
  holder.__bibiRest ??= createRestHandler({
    operations: ensureOperations(),
    resolveContext: resolveExecuteContext,
    embed,
    afterCommit: [invitationMailHook],
  });
  return holder.__bibiRest;
}
