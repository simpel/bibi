"use server";

import { createInvoice, type InvoiceDto, sendInvoice, voidInvoice } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateInvoiceActionInput = { ticketId: string };
export type InvoiceIdActionInput = { id: string };

export async function createInvoiceAction({
  ticketId,
}: CreateInvoiceActionInput): Promise<ActionResult<InvoiceDto>> {
  const result = await runOperation({ operation: createInvoice, input: { ticketId } });
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
