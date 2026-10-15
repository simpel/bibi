"use server";

import { createPayment, type PaymentCreateInput, type PaymentDto } from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreatePaymentActionInput = { input: PaymentCreateInput };

export async function createPaymentAction({
  input,
}: CreatePaymentActionInput): Promise<ActionResult<PaymentDto>> {
  return toActionResult({ result: await runOperation({ operation: createPayment, input }) });
}
