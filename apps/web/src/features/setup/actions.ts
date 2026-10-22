"use server";

import {
  archiveSetup,
  createSetup,
  type SetupCreateInput,
  type SetupDto,
  updateSetup,
} from "@bibi/core";
import type { SetupUpdateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

type SetupUpdateInput = z.infer<typeof SetupUpdateInputSchema>;

export type CreateSetupActionInput = { input: SetupCreateInput };
export type UpdateSetupActionInput = { input: SetupUpdateInput };
export type ArchiveSetupActionInput = { id: string };

export async function createSetupAction({
  input,
}: CreateSetupActionInput): Promise<ActionResult<SetupDto>> {
  return toActionResult({ result: await runOperation({ operation: createSetup, input }) });
}

export async function updateSetupAction({
  input,
}: UpdateSetupActionInput): Promise<ActionResult<SetupDto>> {
  return toActionResult({ result: await runOperation({ operation: updateSetup, input }) });
}

export async function archiveSetupAction({
  id,
}: ArchiveSetupActionInput): Promise<ActionResult<SetupDto>> {
  return toActionResult({ result: await runOperation({ operation: archiveSetup, input: { id } }) });
}
