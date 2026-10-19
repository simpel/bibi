"use server";

import {
  createDeposit,
  type DepositCreateInput,
  type DepositDto,
  sendDeposit,
  voidDeposit,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateDepositActionInput = { input: DepositCreateInput };
export type DepositIdActionInput = { id: string };

export async function createDepositAction({
  input,
}: CreateDepositActionInput): Promise<ActionResult<DepositDto>> {
  return toActionResult({ result: await runOperation({ operation: createDeposit, input }) });
}

export async function sendDepositAction({
  id,
}: DepositIdActionInput): Promise<ActionResult<DepositDto>> {
  return toActionResult({ result: await runOperation({ operation: sendDeposit, input: { id } }) });
}

export async function voidDepositAction({
  id,
}: DepositIdActionInput): Promise<ActionResult<DepositDto>> {
  return toActionResult({ result: await runOperation({ operation: voidDeposit, input: { id } }) });
}
