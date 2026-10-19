import type { PipelineSetupDraft } from "@okazi/core/schemas";
import type { UIMessage } from "ai";
import { getToolName, isToolUIPart } from "ai";

const PREVIEW_TOOL = "pipelineSetup_preview";

export type SetupDraftView = {
  itemTypes: string[];
  phases: { name: string; color?: string }[];
};

function draftOf({ input }: { input: unknown }): SetupDraftView | null {
  const draft = input as Partial<PipelineSetupDraft> | null;
  if (!draft?.itemTypes || !draft.phases) return null;
  return {
    itemTypes: draft.itemTypes.map((type) => type.name),
    phases: draft.phases.map((phase) => ({ name: phase.name, color: phase.color })),
  };
}

/** The latest finished `pipelineSetup.preview` call in the chat, reduced to names and colors. */
export function latestSetupDraft({ messages }: { messages: UIMessage[] }): SetupDraftView | null {
  for (const message of [...messages].reverse()) {
    for (const part of [...message.parts].reverse()) {
      if (!isToolUIPart(part) || getToolName(part) !== PREVIEW_TOOL) continue;
      if (part.state !== "output-available") continue;
      const view = draftOf({ input: part.input });
      if (view) return view;
    }
  }
  return null;
}
