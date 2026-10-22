"use server";

import {
  type AlternativeGroupChooseInput,
  type AlternativeGroupCreateInput,
  type AlternativeGroupDto,
  type AlternativeGroupUpdateInput,
  archiveAlternativeGroup,
  chooseAlternative,
  createAlternativeGroup,
  updateAlternativeGroup,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateAlternativeGroupActionInput = { input: AlternativeGroupCreateInput };
export type UpdateAlternativeGroupActionInput = { input: AlternativeGroupUpdateInput };
export type ArchiveAlternativeGroupActionInput = { id: string };
export type ChooseAlternativeActionInput = { input: AlternativeGroupChooseInput };

type GroupResult = Promise<ActionResult<AlternativeGroupDto>>;

export async function createAlternativeGroupAction({
  input,
}: CreateAlternativeGroupActionInput): GroupResult {
  return toActionResult({
    result: await runOperation({ operation: createAlternativeGroup, input }),
  });
}

export async function updateAlternativeGroupAction({
  input,
}: UpdateAlternativeGroupActionInput): GroupResult {
  return toActionResult({
    result: await runOperation({ operation: updateAlternativeGroup, input }),
  });
}

export async function archiveAlternativeGroupAction({
  id,
}: ArchiveAlternativeGroupActionInput): GroupResult {
  return toActionResult({
    result: await runOperation({ operation: archiveAlternativeGroup, input: { id } }),
  });
}

export async function chooseAlternativeAction({
  input,
}: ChooseAlternativeActionInput): GroupResult {
  return toActionResult({ result: await runOperation({ operation: chooseAlternative, input }) });
}
