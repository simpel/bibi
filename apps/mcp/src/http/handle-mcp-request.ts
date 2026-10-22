import { type EmbedFn, type ExecuteContext, type Result, toHttpStatus } from "@bibi/core";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "../server/create-mcp-server";
import { wwwAuthenticate } from "./protected-resource";

export type ResolveContext = (input: { headers: Headers }) => Promise<Result<ExecuteContext>>;

export type HandleMcpInput = {
  request: Request;
  resolveContext: ResolveContext;
  embed: EmbedFn;
  metadataUrl: string;
};

/** Stateless Streamable HTTP: authenticate, then one server + transport per request. */
export async function handleMcpRequest({
  request,
  resolveContext,
  embed,
  metadataUrl,
}: HandleMcpInput): Promise<Response> {
  const resolved = await resolveContext({ headers: request.headers });
  if (!resolved.ok) {
    const { error } = resolved;
    const status = toHttpStatus({ error });
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (status === 401) headers["www-authenticate"] = wwwAuthenticate({ metadataUrl });
    return new Response(JSON.stringify({ error: { code: error.code, message: error.message } }), {
      status,
      headers,
    });
  }
  const server = createMcpServer({ context: resolved.value, embed });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close();
  }
}
