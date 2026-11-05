"use server";

import {
  archiveRunSheetDefinition,
  createRunSheetDefinition,
  type RunSheetDefinitionCreateInput,
  type RunSheetDefinitionDto,
  type RunSheetDefinitionUpdateInput,
  updateRunSheetDefinition,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateRunSheetDefinitionActionInput = { input: RunSheetDefinitionCreateInput };
export type UpdateRunSheetDefinitionActionInput = { input: RunSheetDefinitionUpdateInput };
export type ArchiveRunSheetDefinitionActionInput = { id: string };

export async function createRunSheetDefinitionAction({
  input,
}: CreateRunSheetDefinitionActionInput): Promise<ActionResult<RunSheetDefinitionDto>> {
  return toActionResult({
    result: await runOperation({ operation: createRunSheetDefinition, input }),
  });
}

export async function updateRunSheetDefinitionAction({
  input,
}: UpdateRunSheetDefinitionActionInput): Promise<ActionResult<RunSheetDefinitionDto>> {
  return toActionResult({
    result: await runOperation({ operation: updateRunSheetDefinition, input }),
  });
}

export async function archiveRunSheetDefinitionAction({
  id,
}: ArchiveRunSheetDefinitionActionInput): Promise<ActionResult<RunSheetDefinitionDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveRunSheetDefinition, input: { id } }),
  });
}
