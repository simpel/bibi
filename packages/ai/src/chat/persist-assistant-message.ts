import type { MCPClient } from "@ai-sdk/mcp";
import { ok, type Result } from "@okazi/core";
import { callMcpTool } from "../mcp/call-mcp-tool";
import { fitParts } from "./fit-parts";

export type PersistAssistantMessageInput = {
  /** The run's MCP client (AI actor + this conversation id). */
  client: MCPClient;
  conversationId: string;
  parts: readonly unknown[];
  metadata: Record<string, unknown>;
};

/**
 * ASSISTANT turn (text + tool calls/results incl. approval proposals) through the real MCP tool
 * `message_append` as the AI actor: core allows the AI only ASSISTANT/TOOL in its own
 * conversation, and the audit row says `AI` + conversation id.
 */
export async function persistAssistantMessage({
  client,
  conversationId,
  parts,
  metadata,
}: PersistAssistantMessageInput): Promise<Result<{ stored: boolean }>> {
  const stored = fitParts({ parts });
  if (stored.length === 0) return ok({ value: { stored: false } });
  const result = await callMcpTool({
    client,
    name: "message_append",
    args: { conversationId, role: "ASSISTANT", parts: stored, metadata },
  });
  return result.ok ? ok({ value: { stored: true } }) : result;
}
