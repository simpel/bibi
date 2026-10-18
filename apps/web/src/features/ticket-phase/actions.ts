"use server";

import {
  archiveTicketPhase,
  createTicketPhase,
  importTicketPhaseTemplate,
  reorderTicketPhases,
  setTicketPhaseTransitions,
  type TicketPhaseArchiveInput,
  type TicketPhaseCreateInput,
  type TicketPhaseDto,
  type TicketPhaseImportResult,
  type TicketPhaseUpdateInput,
  updateTicketPhase,
} from "@okazi/core";
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

/** Imports the "Conference venue" phases; names that already exist are skipped. */
export async function importTicketPhaseTemplateAction(): Promise<
  ActionResult<TicketPhaseImportResult>
> {
  const input = { template: "conference-venue" as const };
  const result = await runOperation({ operation: importTicketPhaseTemplate, input });
  return toActionResult({ result });
}
