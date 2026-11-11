import { getLogger, withRequestLogging } from "@bibi/logger";
import { corsHeaders, isOriginAllowed } from "./cors";
import { jsonResponse, type RouteRequestInput, routeRequest } from "./route-request";

export type CreateMcpHandlerInput = Omit<RouteRequestInput, "request"> & {
  /** Origins allowed to call from a browser (the web app). */
  allowedOrigins: readonly string[];
};

export type McpHandler = (request: Request) => Promise<Response>;

type RespondInput = {
  request: Request;
  allowedOrigins: readonly string[];
  rest: Omit<CreateMcpHandlerInput, "allowedOrigins">;
};

async function respond({ request, allowedOrigins, rest }: RespondInput): Promise<Response> {
  if (!isOriginAllowed({ request, allowedOrigins })) {
    return jsonResponse({ status: 403, body: { error: "Origin not allowed" } });
  }
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return routeRequest({ ...rest, request }).catch((error: unknown) => {
    getLogger().error({ event: "http.unhandledError", err: error });
    return jsonResponse({ status: 500, body: { error: "Internal error" } });
  });
}

/**
 * The MCP HTTP surface as one Web `Request` → `Response` function (ADR 0104): the web app mounts it
 * at `/mcp` and `/health`. Origin check, CORS and request logging (surface `mcp`) included.
 */
export function createMcpHandler({ allowedOrigins, ...rest }: CreateMcpHandlerInput): McpHandler {
  const handle = withRequestLogging({
    surface: "mcp",
    handler: (request) => respond({ request, allowedOrigins, rest }),
  });
  return async (request) => {
    const response = await handle(request);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(corsHeaders({ request }))) headers.set(name, value);
    return new Response(response.body, { status: response.status, headers });
  };
}
