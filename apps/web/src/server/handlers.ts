import "server-only";
import { createRestHandler } from "@okazi/api";
import { invitationMailHook, resolveExecuteContext } from "@okazi/auth";
import { createGraphqlHandler } from "@okazi/graphql";
import { embed } from "./embed";
import { ensureOperations } from "./operations";

type Handler = (request: Request) => Promise<Response>;

const holder = globalThis as typeof globalThis & {
  __okaziGraphql?: Handler;
  __okaziRest?: Handler;
};

/** `POST /api/graphql`: the graph for external callers (API key / OAuth / session). */
export function graphqlHandler(): Handler {
  holder.__okaziGraphql ??= createGraphqlHandler({
    resolveContext: resolveExecuteContext,
    embed,
    afterCommit: [invitationMailHook],
  });
  return holder.__okaziGraphql;
}

/** `/api/v1/*`: REST + OpenAPI derived from the registered core operations. */
export function restHandler(): Handler {
  holder.__okaziRest ??= createRestHandler({
    operations: ensureOperations(),
    resolveContext: resolveExecuteContext,
    embed,
    afterCommit: [invitationMailHook],
  });
  return holder.__okaziRest;
}
