"use server";

import {
  archiveRequirement,
  createRequirement,
  type RequirementCreateInput,
  type RequirementDto,
  type RequirementUpdateInput,
  updateRequirement,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateRequirementActionInput = { input: RequirementCreateInput };
export type UpdateRequirementActionInput = { input: RequirementUpdateInput };
export type ArchiveRequirementActionInput = { id: string };

export async function createRequirementAction({
  input,
}: CreateRequirementActionInput): Promise<ActionResult<RequirementDto>> {
  return toActionResult({ result: await runOperation({ operation: createRequirement, input }) });
}

export async function updateRequirementAction({
  input,
}: UpdateRequirementActionInput): Promise<ActionResult<RequirementDto>> {
  return toActionResult({ result: await runOperation({ operation: updateRequirement, input }) });
}

export async function archiveRequirementAction({
  id,
}: ArchiveRequirementActionInput): Promise<ActionResult<RequirementDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveRequirement, input: { id } }),
  });
}
