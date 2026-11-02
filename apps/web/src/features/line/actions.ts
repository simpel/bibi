"use server";

import {
  archiveLine,
  changeLineState,
  createLine,
  expandLineBundle,
  followLineStatus,
  type LineCreateOperationInput,
  type LineDto,
  type LineExpandBundleInput,
  type LineUpdateInput,
  listLines,
  updateLine,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateLineActionInput = { input: LineCreateOperationInput };
export type UpdateLineActionInput = { input: LineUpdateInput };
export type ArchiveLineActionInput = { id: string };

export async function createLineAction({
  input,
}: CreateLineActionInput): Promise<ActionResult<LineDto>> {
  return toActionResult({ result: await runOperation({ operation: createLine, input }) });
}

export async function updateLineAction({
  input,
}: UpdateLineActionInput): Promise<ActionResult<LineDto>> {
  return toActionResult({ result: await runOperation({ operation: updateLine, input }) });
}

export async function archiveLineAction({
  id,
}: ArchiveLineActionInput): Promise<ActionResult<LineDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveLine, input: { id } }),
  });
}

export type ChangeLineStateActionInput = { lineId: string; stateId: string };

/** Overrides one line's state (ADR 0044). */
export async function changeLineStateAction({
  lineId,
  stateId,
}: ChangeLineStateActionInput): Promise<ActionResult<LineDto>> {
  return toActionResult({
    result: await runOperation({ operation: changeLineState, input: { lineId, stateId } }),
  });
}

export type FollowLineStatusActionInput = { lineId: string };

/** Lets an overridden line follow the ticket's status again (ADR 0044). */
export async function followLineStatusAction({
  lineId,
}: FollowLineStatusActionInput): Promise<ActionResult<LineDto>> {
  return toActionResult({
    result: await runOperation({ operation: followLineStatus, input: { lineId } }),
  });
}

export type ExpandBundleActionInput = { input: LineExpandBundleInput };

/** Adds a bundle as a bundle line with its part lines (ADR 0059). */
export async function expandBundleAction({
  input,
}: ExpandBundleActionInput): Promise<ActionResult<{ items: LineDto[] }>> {
  return toActionResult({ result: await runOperation({ operation: expandLineBundle, input }) });
}

/** Another booking's timed line of an item, as the intake's day snapshot draws it. */
export type ItemLine = { id: string; itemId: string; name: string; startsAt: Date; endsAt: Date };

export type LoadItemLinesActionInput = { itemIds: string[]; from: string; to: string };

/**
 * The timed lines of some items between two instants (`line.list` by item), for items without
 * occupancy such as a buffet (ADR 0081, the intake's calendar snapshot). At most 100 per item.
 */
export async function loadItemLinesAction({
  itemIds,
  from,
  to,
}: LoadItemLinesActionInput): Promise<ActionResult<ItemLine[]>> {
  const lines: ItemLine[] = [];
  for (const itemId of itemIds.slice(0, 20)) {
    const input = { itemId, from: new Date(from), to: new Date(to), limit: 100 };
    const result = await runOperation({ operation: listLines, input });
    if (!result.ok) return toActionResult({ result });
    for (const { id, name, startsAt, endsAt } of result.value.items) {
      if (startsAt && endsAt) lines.push({ id, itemId, name, startsAt, endsAt });
    }
  }
  return toActionResult({ result: { ok: true, value: lines } });
}
