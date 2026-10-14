import { createServer, type Server } from "node:http";
import { getLogger, withRequestLogging } from "@okazi/logger";
import { corsHeaders, isOriginAllowed } from "./cors";
import { sendWebResponse, toWebRequest } from "./node-adapter";
import { jsonResponse, type RouteRequestInput, routeRequest } from "./route-request";

export type CreateHttpServerInput = Omit<RouteRequestInput, "request"> & {
  /** Origins allowed to call from a browser (the web app). */
  allowedOrigins: readonly string[];
};

type RespondInput = {
  request: Request;
  allowedOrigins: readonly string[];
  rest: Omit<CreateHttpServerInput, "allowedOrigins">;
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

/** Tiny `node:http` host adapting Node requests to Web `Request`/`Response`. */
export function createHttpServer({ allowedOrigins, ...rest }: CreateHttpServerInput): Server {
  const handle = withRequestLogging({
    surface: "mcp",
    handler: (request) => respond({ request, allowedOrigins, rest }),
  });
  return createServer(async (req, res) => {
    const request = toWebRequest({ req, baseUrl: rest.baseUrl });
    const response = await handle(request);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(corsHeaders({ request }))) headers.set(name, value);
    const { status, body } = response;
    await sendWebResponse({ res, response: new Response(body, { status, headers }) });
  });
}
