"use server";

import {
  archiveItem,
  createItem,
  type ItemCreateInput,
  type ItemDto,
  type ItemSaveAsBundleInput,
  type ItemUpdateInput,
  saveItemAsBundle,
  updateItem,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateItemActionInput = { input: ItemCreateInput };
export type UpdateItemActionInput = { input: ItemUpdateInput };
export type ArchiveItemActionInput = { id: string };
export type SaveItemAsBundleActionInput = { input: ItemSaveAsBundleInput };

export async function createItemAction({
  input,
}: CreateItemActionInput): Promise<ActionResult<ItemDto>> {
  return toActionResult({ result: await runOperation({ operation: createItem, input }) });
}

export async function updateItemAction({
  input,
}: UpdateItemActionInput): Promise<ActionResult<ItemDto>> {
  return toActionResult({ result: await runOperation({ operation: updateItem, input }) });
}

export async function archiveItemAction({
  id,
}: ArchiveItemActionInput): Promise<ActionResult<ItemDto>> {
  return toActionResult({ result: await runOperation({ operation: archiveItem, input: { id } }) });
}

export async function saveItemAsBundleAction({
  input,
}: SaveItemAsBundleActionInput): Promise<ActionResult<ItemDto>> {
  return toActionResult({ result: await runOperation({ operation: saveItemAsBundle, input }) });
}
