const ALLOWED_HEADERS = [
  "authorization",
  "content-type",
  "mcp-protocol-version",
  "mcp-session-id",
  "x-api-key",
  "x-okazi-actor",
  "x-okazi-conversation-id",
].join(", ");

export type CorsInput = { request: Request; allowedOrigins: readonly string[] };

/** Browser calls (e.g. the web app confirming an approval) are only allowed from known origins. */
export function isOriginAllowed({ request, allowedOrigins }: CorsInput): boolean {
  const origin = request.headers.get("origin");
  return origin === null || allowedOrigins.includes(origin);
}

export type CorsHeadersInput = { request: Request };

export function corsHeaders({ request }: CorsHeadersInput): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": ALLOWED_HEADERS,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-expose-headers": "www-authenticate, mcp-session-id",
    vary: "origin",
  };
}
