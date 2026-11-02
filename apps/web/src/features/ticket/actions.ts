"use server";

import {
  changeTicketStatus,
  createTicket,
  expireTicketHolds,
  type LineDto,
  previewTicketLines,
  type TicketChangeStatusInput,
  type TicketCreateInput,
  type TicketDto,
  type TicketPreviewLines,
  type TicketPreviewLinesInput,
  type TicketUpdateInput,
  updateTicket,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateTicketActionInput = { input: TicketCreateInput };
export type UpdateTicketActionInput = { input: TicketUpdateInput };
export type ChangeTicketStatusActionInput = { input: TicketChangeStatusInput };

export async function createTicketAction({
  input,
}: CreateTicketActionInput): Promise<ActionResult<TicketDto>> {
  return toActionResult({ result: await runOperation({ operation: createTicket, input }) });
}

export async function updateTicketAction({
  input,
}: UpdateTicketActionInput): Promise<ActionResult<TicketDto>> {
  return toActionResult({ result: await runOperation({ operation: updateTicket, input }) });
}

export async function changeTicketStatusAction({
  input,
}: ChangeTicketStatusActionInput): Promise<ActionResult<TicketDto>> {
  return toActionResult({ result: await runOperation({ operation: changeTicketStatus, input }) });
}

/** Runs `ticket.expireHolds` by hand; the scheduler otherwise does it every 15 minutes. */
export async function expireTicketHoldsAction(): Promise<ActionResult<{ items: LineDto[] }>> {
  return toActionResult({
    result: await runOperation({ operation: expireTicketHolds, input: {} }),
  });
}

export type PreviewTicketLinesActionInput = { input: TicketPreviewLinesInput };

/** Plans packages or draft lines without writing anything (`ticket.previewLines`, ADR 0081). */
export async function previewTicketLinesAction({
  input,
}: PreviewTicketLinesActionInput): Promise<ActionResult<TicketPreviewLines>> {
  return toActionResult({ result: await runOperation({ operation: previewTicketLines, input }) });
}
