"use server";

import {
  archiveResponsibility,
  createResponsibility,
  type ResponsibilityCreateInput,
  type ResponsibilityDto,
  type ResponsibilityUpdateInput,
  updateResponsibility,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateResponsibilityActionInput = { input: ResponsibilityCreateInput };
export type UpdateResponsibilityActionInput = { input: ResponsibilityUpdateInput };
export type ArchiveResponsibilityActionInput = { id: string };

export async function createResponsibilityAction({
  input,
}: CreateResponsibilityActionInput): Promise<ActionResult<ResponsibilityDto>> {
  return toActionResult({ result: await runOperation({ operation: createResponsibility, input }) });
}

export async function updateResponsibilityAction({
  input,
}: UpdateResponsibilityActionInput): Promise<ActionResult<ResponsibilityDto>> {
  return toActionResult({ result: await runOperation({ operation: updateResponsibility, input }) });
}

export async function archiveResponsibilityAction({
  id,
}: ArchiveResponsibilityActionInput): Promise<ActionResult<ResponsibilityDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveResponsibility, input: { id } }),
  });
}
