"use server";

import {
  changeTicketPhase,
  createTicket,
  exportTicket,
  type TicketChangePhaseInput,
  type TicketCreateInput,
  type TicketDto,
  type TicketExport,
  type TicketUpdateInput,
  updateTicket,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateTicketActionInput = { input: TicketCreateInput };
export type UpdateTicketActionInput = { input: TicketUpdateInput };
export type ChangeTicketPhaseActionInput = { input: TicketChangePhaseInput };

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

export async function changeTicketPhaseAction({
  input,
}: ChangeTicketPhaseActionInput): Promise<ActionResult<TicketDto>> {
  return toActionResult({ result: await runOperation({ operation: changeTicketPhase, input }) });
}

export type ExportTicketActionInput = { id: string };

/** The ticket as a versioned json document and its file name (for the browser download). */
export async function exportTicketAction({
  id,
}: ExportTicketActionInput): Promise<ActionResult<TicketExport>> {
  return toActionResult({ result: await runOperation({ operation: exportTicket, input: { id } }) });
}
