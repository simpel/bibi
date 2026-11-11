import "server-only";
import { createRestHandler } from "@bibi/api";
import { billingMailHook, invitationMailHook, resolveExecuteContext } from "@bibi/auth";
import { getEnv } from "@bibi/config";
import { createGraphqlHandler } from "@bibi/graphql";
import { createMcpHandler } from "@bibi/mcp";
import { embed } from "./embed";
import { ensureOperations } from "./operations";

type Handler = (request: Request) => Promise<Response>;

const holder = globalThis as typeof globalThis & {
  __bibiGraphql?: Handler;
  __bibiRest?: Handler;
  __bibiMcp?: Handler;
};

/** `POST /api/graphql`: the graph for external callers (API key / OAuth / session). */
export function graphqlHandler(): Handler {
  holder.__bibiGraphql ??= createGraphqlHandler({
    resolveContext: resolveExecuteContext,
    embed,
    afterCommit: [invitationMailHook, billingMailHook],
  });
  return holder.__bibiGraphql;
}

/** `/api/v1/*`: REST + OpenAPI derived from the registered core operations. */
export function restHandler(): Handler {
  holder.__bibiRest ??= createRestHandler({
    operations: ensureOperations(),
    resolveContext: resolveExecuteContext,
    embed,
    afterCommit: [invitationMailHook, billingMailHook],
  });
  return holder.__bibiRest;
}

/**
 * `/mcp` and `/health`: the MCP server over Streamable HTTP (ADR 0104). `MCP_URL` is its public
 * base URL and OAuth resource, in production its own host routed to this app.
 */
export function mcpHandler(): Handler {
  if (!holder.__bibiMcp) {
    // Installs the file store and text extraction ports that MCP tools reach through core.
    ensureOperations();
    const { MCP_URL, WEB_URL } = getEnv();
    holder.__bibiMcp = createMcpHandler({
      resolveContext: resolveExecuteContext,
      embed,
      baseUrl: MCP_URL,
      allowedOrigins: [new URL(WEB_URL).origin],
    });
  }
  return holder.__bibiMcp;
}
