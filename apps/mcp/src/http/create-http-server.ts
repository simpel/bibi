import { createServer, type Server } from "node:http";
import { appError, type EmbedFn } from "@okazi/core";
import { corsHeaders, isOriginAllowed } from "./cors";
import { handleMcpRequest, type ResolveContext } from "./handle-mcp-request";
import { sendWebResponse, toWebRequest } from "./node-adapter";
import {
  MCP_ENDPOINT_PATH,
  PROTECTED_RESOURCE_PATH,
  protectedResourceMetadata,
} from "./protected-resource";

export type CreateHttpServerInput = {
  resolveContext: ResolveContext;
  embed: EmbedFn;
  /** Public base URL of this server, e.g. `http://localhost:3001` (`MCP_URL`). */
  baseUrl: string;
  /** Issuer of the OAuth authorization server (Better Auth base URL incl. base path). */
  authorizationServer: string;
  /** Origins allowed to call from a browser (the web app). */
  allowedOrigins: readonly string[];
};

function json({ status, body }: { status: number; body: unknown }): Response {
  return Response.json(body, { status });
}

/** Tiny `node:http` host: `/mcp`, `/.well-known/oauth-protected-resource`, `/health`. */
export function createHttpServer(input: CreateHttpServerInput): Server {
  const { baseUrl, authorizationServer, allowedOrigins } = input;
  const resource = new URL(MCP_ENDPOINT_PATH, baseUrl).toString();
  const metadataUrl = new URL(PROTECTED_RESOURCE_PATH, baseUrl).toString();
  const route = async (request: Request): Promise<Response> => {
    const { pathname } = new URL(request.url);
    if (pathname === "/health") return json({ status: 200, body: { ok: true } });
    if (pathname.startsWith(PROTECTED_RESOURCE_PATH)) {
      return json({
        status: 200,
        body: protectedResourceMetadata({ resource, authorizationServer }),
      });
    }
    if (pathname !== MCP_ENDPOINT_PATH) return json({ status: 404, body: { error: "Not found" } });
    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: { allow: "POST, OPTIONS" } });
    }
    return handleMcpRequest({ request, metadataUrl, ...input });
  };
  return createServer(async (req, res) => {
    const request = toWebRequest({ req, baseUrl });
    let response: Response;
    if (!isOriginAllowed({ request, allowedOrigins })) {
      response = json({
        status: 403,
        body: { error: appError({ code: "FORBIDDEN", message: "Origin not allowed" }).message },
      });
    } else if (request.method === "OPTIONS") {
      response = new Response(null, { status: 204 });
    } else {
      response = await route(request).catch(() =>
        json({ status: 500, body: { error: "Internal error" } }),
      );
    }
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(corsHeaders({ request }))) headers.set(name, value);
    await sendWebResponse({
      res,
      response: new Response(response.body, { status: response.status, headers }),
    });
  });
}
