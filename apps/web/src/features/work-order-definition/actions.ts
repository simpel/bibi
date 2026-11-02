"use server";

import {
  archiveWorkOrderDefinition,
  createWorkOrderDefinition,
  updateWorkOrderDefinition,
  type WorkOrderDefinitionCreateInput,
  type WorkOrderDefinitionDto,
  type WorkOrderDefinitionUpdateInput,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateWorkOrderDefinitionActionInput = { input: WorkOrderDefinitionCreateInput };
export type UpdateWorkOrderDefinitionActionInput = { input: WorkOrderDefinitionUpdateInput };
export type ArchiveWorkOrderDefinitionActionInput = { id: string };

export async function createWorkOrderDefinitionAction({
  input,
}: CreateWorkOrderDefinitionActionInput): Promise<ActionResult<WorkOrderDefinitionDto>> {
  return toActionResult({
    result: await runOperation({ operation: createWorkOrderDefinition, input }),
  });
}

export async function updateWorkOrderDefinitionAction({
  input,
}: UpdateWorkOrderDefinitionActionInput): Promise<ActionResult<WorkOrderDefinitionDto>> {
  return toActionResult({
    result: await runOperation({ operation: updateWorkOrderDefinition, input }),
  });
}

export async function archiveWorkOrderDefinitionAction({
  id,
}: ArchiveWorkOrderDefinitionActionInput): Promise<ActionResult<WorkOrderDefinitionDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveWorkOrderDefinition, input: { id } }),
  });
}
