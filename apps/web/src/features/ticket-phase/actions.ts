"use server";

import {
  archiveTicketPhase,
  createTicketPhase,
  importPhaseGridTemplate,
  importTicketPhaseTemplate,
  previewArchiveTicketPhase,
  reorderTicketPhases,
  setTicketPhaseTransitions,
  type TicketPhaseArchiveInput,
  type TicketPhaseCreateInput,
  type TicketPhaseDto,
  type TicketPhaseImportResult,
  type TicketPhaseUpdateInput,
  updateTicketPhase,
} from "@bibi/core";
import type { ArchivePreview } from "@bibi/core/schemas";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateTicketPhaseActionInput = { input: TicketPhaseCreateInput };
export type UpdateTicketPhaseActionInput = { input: TicketPhaseUpdateInput };
export type ArchiveTicketPhaseActionInput = { input: TicketPhaseArchiveInput };
export type ReorderTicketPhasesActionInput = { ids: string[] };
export type SetTransitionsActionInput = { input: { id: string; toPhaseIds: string[] } };
type PhasePage = { items: TicketPhaseDto[]; nextCursor: string | null };

export async function createTicketPhaseAction({
  input,
}: CreateTicketPhaseActionInput): Promise<ActionResult<TicketPhaseDto>> {
  return toActionResult({ result: await runOperation({ operation: createTicketPhase, input }) });
}

export async function updateTicketPhaseAction({
  input,
}: UpdateTicketPhaseActionInput): Promise<ActionResult<TicketPhaseDto>> {
  return toActionResult({ result: await runOperation({ operation: updateTicketPhase, input }) });
}

export async function archiveTicketPhaseAction({
  input,
}: ArchiveTicketPhaseActionInput): Promise<ActionResult<TicketPhaseDto>> {
  const result = await runOperation({ operation: archiveTicketPhase, input });
  return toActionResult({ result });
}

/** `ticketPhase.archivePreview`: what archiving would move and block; writes nothing. */
export async function previewArchiveTicketPhaseAction({
  input,
}: ArchiveTicketPhaseActionInput): Promise<ActionResult<ArchivePreview>> {
  const result = await runOperation({ operation: previewArchiveTicketPhase, input });
  return toActionResult({ result });
}

export async function reorderTicketPhasesAction({
  ids,
}: ReorderTicketPhasesActionInput): Promise<ActionResult<PhasePage>> {
  const result = await runOperation({ operation: reorderTicketPhases, input: { ids } });
  return toActionResult({ result });
}

export async function setTicketPhaseTransitionsAction({
  input,
}: SetTransitionsActionInput): Promise<ActionResult<TicketPhaseDto>> {
  const result = await runOperation({ operation: setTicketPhaseTransitions, input });
  return toActionResult({ result });
}

/**
 * Imports the "Conference estate" phases, then fills the phase grid's empty cells from the
 * matching template; phase names that already exist are skipped.
 */
export async function importTicketPhaseTemplateAction(): Promise<
  ActionResult<TicketPhaseImportResult>
> {
  const input = { template: "conference-estate" as const };
  const result = await runOperation({ operation: importTicketPhaseTemplate, input });
  if (result.ok) await runOperation({ operation: importPhaseGridTemplate, input });
  return toActionResult({ result });
}
