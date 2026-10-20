import type { PipelineSetupDraft } from "@okazi/core/schemas";
import type { UIMessage } from "ai";
import { getToolName, isToolUIPart } from "ai";

const PREVIEW_TOOL = "pipelineSetup_preview";
const PRESET_TOOL = "pipelineSetup_presetDraft";

export type SetupDraftView = {
  itemTypes: string[];
  phases: { name: string; color?: string }[];
};

type ToolPart = Extract<UIMessage["parts"][number], { toolCallId: string }>;

function draftOf({ draft: value }: { draft: unknown }): SetupDraftView | null {
  const draft = value as Partial<PipelineSetupDraft> | null;
  if (!draft?.itemTypes || !draft.phases) return null;
  return {
    itemTypes: draft.itemTypes.map((type) => type.name),
    phases: draft.phases.map((phase) => ({ name: phase.name, color: phase.color })),
  };
}

/** A preview shows the draft it was given; a preset returns its draft as structured content. */
function draftOfPart({ part }: { part: ToolPart }): SetupDraftView | null {
  if (part.state !== "output-available") return null;
  const tool = getToolName(part);
  if (tool === PREVIEW_TOOL) return draftOf({ draft: part.input });
  if (tool !== PRESET_TOOL) return null;
  const output = part.output as { isError?: boolean; structuredContent?: unknown } | null;
  if (output?.isError) return null;
  return draftOf({ draft: output?.structuredContent });
}

/** The latest finished draft in the chat (a preview or a preset), reduced to names and colors. */
export function latestSetupDraft({ messages }: { messages: UIMessage[] }): SetupDraftView | null {
  for (const message of [...messages].reverse()) {
    for (const part of [...message.parts].reverse()) {
      if (!isToolUIPart(part)) continue;
      const view = draftOfPart({ part });
      if (view) return view;
    }
  }
  return null;
}
