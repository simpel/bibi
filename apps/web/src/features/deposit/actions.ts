"use server";

import {
  createDeposit,
  type DepositCreateInput,
  type DepositDto,
  type DepositRequestInput,
  type PaymentDto,
  requestDeposit,
  sendDeposit,
  voidDeposit,
} from "@bibi/core";
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

export type RequestDepositActionInput = { input: DepositRequestInput };

/** A deposit and its card payment in one step; the payment carries the `/pay` link. */
export async function requestDepositAction({
  input,
}: RequestDepositActionInput): Promise<ActionResult<PaymentDto>> {
  return toActionResult({ result: await runOperation({ operation: requestDeposit, input }) });
}
