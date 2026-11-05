"use server";

import {
  fulfillRunSheet,
  generateRunSheet,
  publishRunSheet,
  type RunSheetDto,
  type RunSheetGenerateInput,
  unfulfillRunSheet,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type GenerateRunSheetActionInput = { input: RunSheetGenerateInput };
export type RunSheetIdActionInput = { id: string };
export type SendRunSheetActionInput = RunSheetIdActionInput;

export async function generateRunSheetAction({
  input,
}: GenerateRunSheetActionInput): Promise<ActionResult<RunSheetDto>> {
  return toActionResult({ result: await runOperation({ operation: generateRunSheet, input }) });
}

export async function publishRunSheetAction({
  id,
}: RunSheetIdActionInput): Promise<ActionResult<RunSheetDto>> {
  return toActionResult({
    result: await runOperation({ operation: publishRunSheet, input: { id } }),
  });
}

/** Compatibility alias for publishRunSheetAction. */
export const sendRunSheetAction = publishRunSheetAction;

export async function fulfillRunSheetAction({
  id,
}: RunSheetIdActionInput): Promise<ActionResult<RunSheetDto>> {
  return toActionResult({
    result: await runOperation({ operation: fulfillRunSheet, input: { id } }),
  });
}

export async function unfulfillRunSheetAction({
  id,
}: RunSheetIdActionInput): Promise<ActionResult<RunSheetDto>> {
  return toActionResult({
    result: await runOperation({ operation: unfulfillRunSheet, input: { id } }),
  });
}
