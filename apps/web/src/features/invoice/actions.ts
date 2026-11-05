"use server";

import { createInvoice, type InvoiceDto, sendInvoice, syncInvoice, voidInvoice } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateInvoiceActionInput = { orderId: string };
export type InvoiceIdActionInput = { id: string };

export async function createInvoiceAction({
  orderId,
}: CreateInvoiceActionInput): Promise<ActionResult<InvoiceDto>> {
  const result = await runOperation({ operation: createInvoice, input: { orderId } });
  return toActionResult({ result });
}

export async function sendInvoiceAction({
  id,
}: InvoiceIdActionInput): Promise<ActionResult<InvoiceDto>> {
  return toActionResult({ result: await runOperation({ operation: sendInvoice, input: { id } }) });
}

export async function voidInvoiceAction({
  id,
}: InvoiceIdActionInput): Promise<ActionResult<InvoiceDto>> {
  return toActionResult({ result: await runOperation({ operation: voidInvoice, input: { id } }) });
}

export async function syncInvoiceAction({
  id,
}: InvoiceIdActionInput): Promise<ActionResult<InvoiceDto>> {
  return toActionResult({ result: await runOperation({ operation: syncInvoice, input: { id } }) });
}
