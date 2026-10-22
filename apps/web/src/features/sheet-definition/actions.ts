"use server";

import {
  archiveSheetDefinition,
  createSheetDefinition,
  type SheetDefinitionCreateInput,
  type SheetDefinitionDto,
  type SheetDefinitionUpdateInput,
  updateSheetDefinition,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateSheetDefinitionActionInput = { input: SheetDefinitionCreateInput };
export type UpdateSheetDefinitionActionInput = { input: SheetDefinitionUpdateInput };
export type ArchiveSheetDefinitionActionInput = { id: string };

export async function createSheetDefinitionAction({
  input,
}: CreateSheetDefinitionActionInput): Promise<ActionResult<SheetDefinitionDto>> {
  return toActionResult({
    result: await runOperation({ operation: createSheetDefinition, input }),
  });
}

export async function updateSheetDefinitionAction({
  input,
}: UpdateSheetDefinitionActionInput): Promise<ActionResult<SheetDefinitionDto>> {
  return toActionResult({
    result: await runOperation({ operation: updateSheetDefinition, input }),
  });
}

export async function archiveSheetDefinitionAction({
  id,
}: ArchiveSheetDefinitionActionInput): Promise<ActionResult<SheetDefinitionDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveSheetDefinition, input: { id } }),
  });
}
