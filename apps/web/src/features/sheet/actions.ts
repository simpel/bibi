"use server";

import { generateSheet, type SheetDto, type SheetGenerateInput, sendSheet } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type GenerateSheetActionInput = { input: SheetGenerateInput };
export type SendSheetActionInput = { id: string };

export async function generateSheetAction({
  input,
}: GenerateSheetActionInput): Promise<ActionResult<SheetDto>> {
  return toActionResult({ result: await runOperation({ operation: generateSheet, input }) });
}

export async function sendSheetAction({
  id,
}: SendSheetActionInput): Promise<ActionResult<SheetDto>> {
  return toActionResult({ result: await runOperation({ operation: sendSheet, input: { id } }) });
}
