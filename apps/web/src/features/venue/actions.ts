"use server";

import {
  archiveVenue,
  createVenue,
  type HoursDto,
  listVenues,
  setVenueHours,
  updateVenue,
  type VenueCreateInput,
  type VenueDto,
  type VenueHoursSetInput,
  type VenueUpdateInput,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateVenueActionInput = { input: VenueCreateInput };
export type UpdateVenueActionInput = { input: VenueUpdateInput };
export type ArchiveVenueActionInput = { id: string };

export async function createVenueAction({
  input,
}: CreateVenueActionInput): Promise<ActionResult<VenueDto>> {
  return toActionResult({ result: await runOperation({ operation: createVenue, input }) });
}

export async function updateVenueAction({
  input,
}: UpdateVenueActionInput): Promise<ActionResult<VenueDto>> {
  return toActionResult({ result: await runOperation({ operation: updateVenue, input }) });
}

export async function archiveVenueAction({
  id,
}: ArchiveVenueActionInput): Promise<ActionResult<VenueDto>> {
  return toActionResult({ result: await runOperation({ operation: archiveVenue, input: { id } }) });
}

export type VenueShortcut = { id: string; name: string };

/** Venues offered as ⌘K quick actions (first page only). */
export async function listVenueShortcutsAction(): Promise<ActionResult<VenueShortcut[]>> {
  const result = await runOperation({ operation: listVenues, input: { limit: 20 } });
  const mapped = result.ok
    ? ({ ok: true, value: result.value.items.map(({ id, name }) => ({ id, name })) } as const)
    : result;
  return toActionResult({ result: mapped });
}

/** The venue's opening hours: the whole weekly pattern and its dated exceptions (ADR 0064). */
export async function saveVenueHoursAction({
  input,
}: {
  input: VenueHoursSetInput;
}): Promise<ActionResult<HoursDto>> {
  return toActionResult({ result: await runOperation({ operation: setVenueHours, input }) });
}
