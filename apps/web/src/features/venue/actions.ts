"use server";

import {
  archiveVenue,
  createVenue,
  listVenues,
  updateVenue,
  type VenueCreateInput,
  type VenueDto,
  type VenueUpdateInput,
} from "@okazi/core";
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
