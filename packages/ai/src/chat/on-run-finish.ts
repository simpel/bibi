import type { MCPClient } from "@ai-sdk/mcp";
import { elapsedMs, getLogContext, getLogger, runWithLogContext } from "@bibi/logger";
import { finishRun } from "./finish-run";
import type { ChatRuntime } from "./handle-chat";
import type { RunFinish } from "./stream-chat";

export type OnRunFinishInput = { runtime: ChatRuntime; client: MCPClient; conversationId: string };

/**
 * The stream's end callback: logs `ai.runCompleted`, then persists and closes the MCP client.
 * Runs after the HTTP response returned, so it re-enters the request's log context (ADR 0014).
 */
export function onRunFinish({ runtime, client, conversationId }: OnRunFinishInput) {
  const context = getLogContext() ?? {};
  const since = performance.now();
  return ({ parts, finishReason }: RunFinish): Promise<void> =>
    runWithLogContext({
      context,
      fn: () => {
        getLogger().info({
          event: "ai.runCompleted",
          model: runtime.modelId,
          conversationId,
          finishReason: finishReason ?? null,
          partCount: parts.length,
          durationMs: elapsedMs({ since }),
        });
        const metadata = { model: runtime.modelId, finishReason: finishReason ?? null };
        return finishRun({ client, conversationId, parts, metadata, report: runtime.report });
      },
    });
}
