"use server";

import {
  archiveTicketStatus,
  createTicketStatus,
  importStatusGridTemplate,
  importTicketStatusTemplate,
  previewArchiveTicketStatus,
  reorderTicketStatuses,
  setTicketStatusTransitions,
  type TicketStatusArchiveInput,
  type TicketStatusCreateInput,
  type TicketStatusDto,
  type TicketStatusImportResult,
  type TicketStatusSetTransitionsInput,
  type TicketStatusUpdateInput,
  updateTicketStatus,
} from "@bibi/core";
import type { ArchivePreview } from "@bibi/core/schemas";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateTicketStatusActionInput = { input: TicketStatusCreateInput };
export type UpdateTicketStatusActionInput = { input: TicketStatusUpdateInput };
export type ArchiveTicketStatusActionInput = { input: TicketStatusArchiveInput };
export type ReorderTicketStatusesActionInput = { ids: string[] };
export type SetTransitionsActionInput = { input: TicketStatusSetTransitionsInput };
type StatusPage = { items: TicketStatusDto[]; nextCursor: string | null };

export async function createTicketStatusAction({
  input,
}: CreateTicketStatusActionInput): Promise<ActionResult<TicketStatusDto>> {
  return toActionResult({ result: await runOperation({ operation: createTicketStatus, input }) });
}

export async function updateTicketStatusAction({
  input,
}: UpdateTicketStatusActionInput): Promise<ActionResult<TicketStatusDto>> {
  return toActionResult({ result: await runOperation({ operation: updateTicketStatus, input }) });
}

export async function archiveTicketStatusAction({
  input,
}: ArchiveTicketStatusActionInput): Promise<ActionResult<TicketStatusDto>> {
  const result = await runOperation({ operation: archiveTicketStatus, input });
  return toActionResult({ result });
}

/** `ticketStatus.archivePreview`: what archiving would move and block; writes nothing. */
export async function previewArchiveTicketStatusAction({
  input,
}: ArchiveTicketStatusActionInput): Promise<ActionResult<ArchivePreview>> {
  const result = await runOperation({ operation: previewArchiveTicketStatus, input });
  return toActionResult({ result });
}

export async function reorderTicketStatusesAction({
  ids,
}: ReorderTicketStatusesActionInput): Promise<ActionResult<StatusPage>> {
  const result = await runOperation({ operation: reorderTicketStatuses, input: { ids } });
  return toActionResult({ result });
}

export async function setTicketStatusTransitionsAction({
  input,
}: SetTransitionsActionInput): Promise<ActionResult<TicketStatusDto>> {
  const result = await runOperation({ operation: setTicketStatusTransitions, input });
  return toActionResult({ result });
}

/**
 * Imports the "Conference estate" statuses, then fills the status grid's empty cells from the
 * matching template; status names that already exist are skipped.
 */
export async function importTicketStatusTemplateAction(): Promise<
  ActionResult<TicketStatusImportResult>
> {
  const input = { template: "conference-estate" as const };
  const result = await runOperation({ operation: importTicketStatusTemplate, input });
  if (result.ok) await runOperation({ operation: importStatusGridTemplate, input });
  return toActionResult({ result });
}
