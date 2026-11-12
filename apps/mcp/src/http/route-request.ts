import type { EmbedFn } from "@bibi/core";
import { handleMcpRequest, type ResolveContext } from "./handle-mcp-request";
import { MCP_ENDPOINT_PATH, PROTECTED_RESOURCE_PATH } from "./protected-resource";

export type RouteRequestInput = {
  request: Request;
  resolveContext: ResolveContext;
  embed: EmbedFn;
  /** Public MCP base URL (`MCP_ORIGIN`), e.g. `https://mcp.heybibi.se`. */
  baseUrl: string;
};

export type JsonResponseInput = { status: number; body: unknown };

export function jsonResponse({ status, body }: JsonResponseInput): Response {
  return Response.json(body, { status });
}

/**
 * `/mcp` and `/health`; everything else is 404. The protected-resource metadata
 * (`/.well-known/oauth-protected-resource`) is served by Better Auth in the web app.
 */
export async function routeRequest({
  request,
  resolveContext,
  embed,
  baseUrl,
}: RouteRequestInput): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname === "/health") return jsonResponse({ status: 200, body: { ok: true } });
  if (pathname !== MCP_ENDPOINT_PATH) {
    return jsonResponse({ status: 404, body: { error: "Not found" } });
  }
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST, OPTIONS" } });
  }
  const metadataUrl = new URL(PROTECTED_RESOURCE_PATH, baseUrl).toString();
  return handleMcpRequest({ request, resolveContext, embed, metadataUrl });
}
