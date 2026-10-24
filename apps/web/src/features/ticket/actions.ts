"use server";

import {
  changeTicketStatus,
  createTicket,
  createTicketFromTemplate,
  expireTicketHolds,
  exportTicket,
  type LineDto,
  type TicketChangeStatusInput,
  type TicketCreateFromTemplateInput,
  type TicketCreateInput,
  type TicketDto,
  type TicketExport,
  type TicketUpdateInput,
  updateTicket,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateTicketActionInput = { input: TicketCreateInput };
export type CreateTicketFromTemplateActionInput = { input: TicketCreateFromTemplateInput };
export type UpdateTicketActionInput = { input: TicketUpdateInput };
export type ChangeTicketStatusActionInput = { input: TicketChangeStatusInput };

export async function createTicketAction({
  input,
}: CreateTicketActionInput): Promise<ActionResult<TicketDto>> {
  return toActionResult({ result: await runOperation({ operation: createTicket, input }) });
}

export async function createTicketFromTemplateAction({
  input,
}: CreateTicketFromTemplateActionInput): Promise<ActionResult<TicketDto>> {
  return toActionResult({
    result: await runOperation({ operation: createTicketFromTemplate, input }),
  });
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

export type ExportTicketActionInput = { id: string };

/** The ticket as a versioned json document and its file name (for the browser download). */
export async function exportTicketAction({
  id,
}: ExportTicketActionInput): Promise<ActionResult<TicketExport>> {
  return toActionResult({ result: await runOperation({ operation: exportTicket, input: { id } }) });
}

/** Runs `ticket.expireHolds` by hand; the scheduler otherwise does it every 15 minutes. */
export async function expireTicketHoldsAction(): Promise<ActionResult<{ items: LineDto[] }>> {
  return toActionResult({
    result: await runOperation({ operation: expireTicketHolds, input: {} }),
  });
}
