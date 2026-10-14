import type { MCPClient } from "@ai-sdk/mcp";
import { persistAssistantMessage } from "./persist-assistant-message";

export type RunErrorReporter = (input: { stage: string; error: unknown }) => void;

export const defaultRunErrorReporter: RunErrorReporter = ({ stage, error }) => {
  console.error(`[@okazi/ai] assistant ${stage} failed`, error);
};

export type FinishRunInput = {
  client: MCPClient;
  conversationId: string;
  parts: readonly unknown[];
  metadata: Record<string, unknown>;
  report: RunErrorReporter;
};

/** End of a run: store the ASSISTANT message via MCP, then ALWAYS close the MCP client. */
export async function finishRun({
  client,
  conversationId,
  parts,
  metadata,
  report,
}: FinishRunInput): Promise<void> {
  try {
    const stored = await persistAssistantMessage({ client, conversationId, parts, metadata });
    if (!stored.ok) report({ stage: "persist", error: stored.error });
  } catch (error) {
    report({ stage: "persist", error });
  } finally {
    await client.close().catch((error: unknown) => report({ stage: "close", error }));
  }
}
