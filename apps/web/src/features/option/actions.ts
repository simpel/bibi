"use server";

import {
  createOption,
  expireDueOptions,
  type OptionCreateInput,
  type OptionDto,
  releaseOption,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateOptionActionInput = { input: OptionCreateInput };
export type ReleaseOptionActionInput = { id: string };

export async function createOptionAction({
  input,
}: CreateOptionActionInput): Promise<ActionResult<OptionDto>> {
  return toActionResult({ result: await runOperation({ operation: createOption, input }) });
}

export async function releaseOptionAction({
  id,
}: ReleaseOptionActionInput): Promise<ActionResult<OptionDto>> {
  return toActionResult({
    result: await runOperation({ operation: releaseOption, input: { id } }),
  });
}

export async function expireDueOptionsAction(): Promise<ActionResult<{ items: OptionDto[] }>> {
  return toActionResult({ result: await runOperation({ operation: expireDueOptions, input: {} }) });
}
