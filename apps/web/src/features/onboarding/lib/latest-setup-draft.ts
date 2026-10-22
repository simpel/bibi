import { type PipelineSetupDraft, PipelineSetupDraftSchema } from "@bibi/core/schemas";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { z } from "zod";

const PREVIEW_TOOL = "pipelineSetup_preview";

/** An MCP result of `pipelineSetup_preview` that reports the draft as ready. */
const ReadyPreviewSchema = z.object({
  isError: z.literal(false).optional(),
  structuredContent: z.object({ ready: z.literal(true) }),
});

export type LatestSetupDraftInput = { messages: readonly UIMessage[] };

/**
 * The draft the assistant ended with (ADR 0045): the input of the latest `pipelineSetup_preview`
 * call that reported it as ready, or null. The setup panel and the approval card both use it.
 */
export function latestSetupDraft({ messages }: LatestSetupDraftInput): PipelineSetupDraft | null {
  for (const message of [...messages].reverse()) {
    if (message.role !== "assistant") continue;
    for (const part of [...message.parts].reverse()) {
      if (!isToolUIPart(part) || getToolName(part) !== PREVIEW_TOOL) continue;
      if (part.state !== "output-available") continue;
      if (!ReadyPreviewSchema.safeParse(part.output).success) continue;
      const draft = PipelineSetupDraftSchema.safeParse(part.input);
      if (draft.success) return draft.data;
    }
  }
  return null;
}
