"use server";

import {
  cancelPayment,
  createPayment,
  type PaymentCreateInput,
  type PaymentDto,
  type PaymentRecordManualInput,
  type PaymentRefundInput,
  recordManualPayment,
  refundPayment,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreatePaymentActionInput = { input: PaymentCreateInput };

export async function createPaymentAction({
  input,
}: CreatePaymentActionInput): Promise<ActionResult<PaymentDto>> {
  return toActionResult({ result: await runOperation({ operation: createPayment, input }) });
}

export type RefundPaymentActionInput = { input: PaymentRefundInput };

export async function refundPaymentAction({
  input,
}: RefundPaymentActionInput): Promise<ActionResult<PaymentDto>> {
  return toActionResult({ result: await runOperation({ operation: refundPayment, input }) });
}

export type CancelPaymentActionInput = { id: string };

export async function cancelPaymentAction({
  id,
}: CancelPaymentActionInput): Promise<ActionResult<PaymentDto>> {
  return toActionResult({
    result: await runOperation({ operation: cancelPayment, input: { id } }),
  });
}

export type RecordManualPaymentActionInput = { input: PaymentRecordManualInput };

export async function recordManualPaymentAction({
  input,
}: RecordManualPaymentActionInput): Promise<ActionResult<PaymentDto>> {
  return toActionResult({ result: await runOperation({ operation: recordManualPayment, input }) });
}
