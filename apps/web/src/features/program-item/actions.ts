"use server";

import {
  archiveProgramItem,
  createProgramItem,
  type ProgramItemCreateInput,
  type ProgramItemDto,
  type ProgramItemUpdateInput,
  updateProgramItem,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateProgramItemActionInput = { input: ProgramItemCreateInput };
export type UpdateProgramItemActionInput = { input: ProgramItemUpdateInput };
export type ArchiveProgramItemActionInput = { id: string };

export async function createProgramItemAction({
  input,
}: CreateProgramItemActionInput): Promise<ActionResult<ProgramItemDto>> {
  return toActionResult({ result: await runOperation({ operation: createProgramItem, input }) });
}

export async function updateProgramItemAction({
  input,
}: UpdateProgramItemActionInput): Promise<ActionResult<ProgramItemDto>> {
  return toActionResult({ result: await runOperation({ operation: updateProgramItem, input }) });
}

export async function archiveProgramItemAction({
  id,
}: ArchiveProgramItemActionInput): Promise<ActionResult<ProgramItemDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveProgramItem, input: { id } }),
  });
}
