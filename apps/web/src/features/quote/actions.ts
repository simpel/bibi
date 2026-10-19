"use server";

import {
  acceptQuote,
  createQuote,
  declineQuote,
  expireQuote,
  type QuoteCreateInput,
  type QuoteDto,
  type QuoteIdInput,
  type QuoteUpdateInput,
  reviseQuote,
  sendQuote,
  updateQuote,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export async function createQuoteAction({
  input,
}: {
  input: QuoteCreateInput;
}): Promise<ActionResult<QuoteDto>> {
  return toActionResult({ result: await runOperation({ operation: createQuote, input }) });
}

export async function updateQuoteAction({
  input,
}: {
  input: QuoteUpdateInput;
}): Promise<ActionResult<QuoteDto>> {
  return toActionResult({ result: await runOperation({ operation: updateQuote, input }) });
}

export async function reviseQuoteAction({ id }: QuoteIdInput): Promise<ActionResult<QuoteDto>> {
  return toActionResult({ result: await runOperation({ operation: reviseQuote, input: { id } }) });
}

export async function sendQuoteAction({ id }: QuoteIdInput): Promise<ActionResult<QuoteDto>> {
  return toActionResult({ result: await runOperation({ operation: sendQuote, input: { id } }) });
}

export async function acceptQuoteAction({ id }: QuoteIdInput): Promise<ActionResult<QuoteDto>> {
  return toActionResult({ result: await runOperation({ operation: acceptQuote, input: { id } }) });
}

export async function declineQuoteAction({ id }: QuoteIdInput): Promise<ActionResult<QuoteDto>> {
  return toActionResult({ result: await runOperation({ operation: declineQuote, input: { id } }) });
}

export async function expireQuoteAction({ id }: QuoteIdInput): Promise<ActionResult<QuoteDto>> {
  return toActionResult({ result: await runOperation({ operation: expireQuote, input: { id } }) });
}
