"use server";

import {
  activatePipelineSetup,
  type PipelineActivateOutput,
  type PipelinePreview,
  type PipelineSetupDraft,
  previewPipelineSetup,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type PipelineSetupActionInput = { input: PipelineSetupDraft };

/** `pipelineSetup.preview`: problems and the simulated ticket; writes nothing. */
export async function previewPipelineSetupAction({
  input,
}: PipelineSetupActionInput): Promise<ActionResult<PipelinePreview>> {
  return toActionResult({ result: await runOperation({ operation: previewPipelineSetup, input }) });
}

/** `pipelineSetup.activate`: saves the whole setup as one audited batch. */
export async function activatePipelineSetupAction({
  input,
}: PipelineSetupActionInput): Promise<ActionResult<PipelineActivateOutput>> {
  const result = await runOperation({ operation: activatePipelineSetup, input });
  return toActionResult({ result });
}
