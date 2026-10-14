import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { ACTOR_HEADER, CONVERSATION_HEADER, mcpResourceUrl } from "@okazi/auth";
import { getLogContext, REQUEST_ID_HEADER } from "@okazi/logger";

export type McpCaller =
  /** The assistant acting for the user in one conversation: commands become proposals. */
  | { kind: "ai"; conversationId: string }
  /** The user themself (approval confirmation): never carries the AI headers. */
  | { kind: "user" };

export type ConnectMcpInput = {
  accessToken: string;
  caller: McpCaller;
  /** MCP endpoint; default `${MCP_URL}/mcp`. */
  url?: string;
};

export type McpHeadersInput = Pick<ConnectMcpInput, "accessToken" | "caller">;

export function mcpHeaders({ accessToken, caller }: McpHeadersInput): Record<string, string> {
  const headers: Record<string, string> = { authorization: `Bearer ${accessToken}` };
  // One request id across chat → MCP → core, so the whole AI run reads as one trace (ADR 0014).
  const requestId = getLogContext()?.requestId;
  if (requestId) headers[REQUEST_ID_HEADER] = requestId;
  if (caller.kind === "ai") {
    headers[ACTOR_HEADER] = "ai";
    headers[CONVERSATION_HEADER] = caller.conversationId;
  }
  return headers;
}

/** AI SDK MCP client over Streamable HTTP against apps/mcp. Callers must `close()` it. */
export function connectMcp({ accessToken, caller, url }: ConnectMcpInput): Promise<MCPClient> {
  return createMCPClient({
    clientName: "okazi-assistant",
    transport: {
      type: "http",
      url: url ?? mcpResourceUrl(),
      headers: mcpHeaders({ accessToken, caller }),
    },
  });
}
