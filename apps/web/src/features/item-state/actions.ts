"use server";

import {
  archiveItemState,
  createItemState,
  type ItemStateCreateInput,
  type ItemStateDto,
  type ItemStateUpdateInput,
  previewArchiveItemState,
  reorderItemStates,
  setItemStateTransitions,
  updateItemState,
} from "@bibi/core";
import type { ArchivePreview } from "@bibi/core/schemas";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateItemStateActionInput = { input: ItemStateCreateInput };
export type UpdateItemStateActionInput = { input: ItemStateUpdateInput };
export type ArchiveItemStateActionInput = { input: { id: string; targetStateId?: string } };
export type ReorderItemStatesActionInput = { entityTypeId: string; ids: string[] };
export type SetItemStateTransitionsActionInput = { input: { id: string; toStateIds: string[] } };
type StatePage = { items: ItemStateDto[]; nextCursor: string | null };

export async function createItemStateAction({
  input,
}: CreateItemStateActionInput): Promise<ActionResult<ItemStateDto>> {
  return toActionResult({ result: await runOperation({ operation: createItemState, input }) });
}

export async function updateItemStateAction({
  input,
}: UpdateItemStateActionInput): Promise<ActionResult<ItemStateDto>> {
  return toActionResult({ result: await runOperation({ operation: updateItemState, input }) });
}

export async function archiveItemStateAction({
  input,
}: ArchiveItemStateActionInput): Promise<ActionResult<ItemStateDto>> {
  return toActionResult({ result: await runOperation({ operation: archiveItemState, input }) });
}

/** `itemState.archivePreview`: what archiving would move and block; writes nothing. */
export async function previewArchiveItemStateAction({
  input,
}: ArchiveItemStateActionInput): Promise<ActionResult<ArchivePreview>> {
  return toActionResult({
    result: await runOperation({ operation: previewArchiveItemState, input }),
  });
}

export async function reorderItemStatesAction({
  entityTypeId,
  ids,
}: ReorderItemStatesActionInput): Promise<ActionResult<StatePage>> {
  const result = await runOperation({ operation: reorderItemStates, input: { entityTypeId, ids } });
  return toActionResult({ result });
}

export async function setItemStateTransitionsAction({
  input,
}: SetItemStateTransitionsActionInput): Promise<ActionResult<ItemStateDto>> {
  const result = await runOperation({ operation: setItemStateTransitions, input });
  return toActionResult({ result });
}
