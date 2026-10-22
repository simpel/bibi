"use server";

import {
  archiveFieldDefinition,
  createFieldDefinition,
  type FieldDefinitionCreateInput,
  type FieldDefinitionDto,
  type FieldDefinitionUpdateInput,
  getFieldDefinition,
  updateFieldDefinition,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateFieldActionInput = { input: FieldDefinitionCreateInput };
export type UpdateFieldActionInput = { input: FieldDefinitionUpdateInput };
export type ArchiveFieldActionInput = { id: string };

export async function createFieldAction({
  input,
}: CreateFieldActionInput): Promise<ActionResult<FieldDefinitionDto>> {
  return toActionResult({
    result: await runOperation({ operation: createFieldDefinition, input }),
  });
}

export async function updateFieldAction({
  input,
}: UpdateFieldActionInput): Promise<ActionResult<FieldDefinitionDto>> {
  return toActionResult({
    result: await runOperation({ operation: updateFieldDefinition, input }),
  });
}

export async function archiveFieldAction({
  id,
}: ArchiveFieldActionInput): Promise<ActionResult<FieldDefinitionDto>> {
  const input = { id };
  return toActionResult({
    result: await runOperation({ operation: archiveFieldDefinition, input }),
  });
}

export type MoveFieldActionInput = { id: string; otherId: string };

/** Swaps the positions of two fields (move up/down in the type's field list). */
export async function moveFieldAction({
  id,
  otherId,
}: MoveFieldActionInput): Promise<ActionResult<FieldDefinitionDto>> {
  const [first, second] = await Promise.all([
    runOperation({ operation: getFieldDefinition, input: { id } }),
    runOperation({ operation: getFieldDefinition, input: { id: otherId } }),
  ]);
  if (!first.ok) return toActionResult({ result: first });
  if (!second.ok) return toActionResult({ result: second });
  const moved = await runOperation({
    operation: updateFieldDefinition,
    input: { id, position: second.value.position },
  });
  if (!moved.ok) return toActionResult({ result: moved });
  const other = { id: otherId, position: first.value.position };
  return toActionResult({
    result: await runOperation({ operation: updateFieldDefinition, input: other }),
  });
}
