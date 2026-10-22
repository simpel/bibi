import type { EmbedFn } from "@bibi/core";
import { handleMcpRequest, type ResolveContext } from "./handle-mcp-request";
import {
  MCP_ENDPOINT_PATH,
  PROTECTED_RESOURCE_PATH,
  protectedResourceMetadata,
} from "./protected-resource";

export type RouteRequestInput = {
  request: Request;
  resolveContext: ResolveContext;
  embed: EmbedFn;
  /** Public base URL of this server, e.g. `http://localhost:3001` (`MCP_URL`). */
  baseUrl: string;
  /** Issuer of the OAuth authorization server (Better Auth base URL incl. base path). */
  authorizationServer: string;
};

export type JsonResponseInput = { status: number; body: unknown };

export function jsonResponse({ status, body }: JsonResponseInput): Response {
  return Response.json(body, { status });
}

/** `/mcp`, `/.well-known/oauth-protected-resource` and `/health`; everything else is 404. */
export async function routeRequest({
  request,
  resolveContext,
  embed,
  baseUrl,
  authorizationServer,
}: RouteRequestInput): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname === "/health") return jsonResponse({ status: 200, body: { ok: true } });
  if (pathname.startsWith(PROTECTED_RESOURCE_PATH)) {
    const resource = new URL(MCP_ENDPOINT_PATH, baseUrl).toString();
    const body = protectedResourceMetadata({ resource, authorizationServer });
    return jsonResponse({ status: 200, body });
  }
  if (pathname !== MCP_ENDPOINT_PATH) {
    return jsonResponse({ status: 404, body: { error: "Not found" } });
  }
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST, OPTIONS" } });
  }
  const metadataUrl = new URL(PROTECTED_RESOURCE_PATH, baseUrl).toString();
  return handleMcpRequest({ request, resolveContext, embed, metadataUrl });
}
