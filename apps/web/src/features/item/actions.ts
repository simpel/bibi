"use server";

import {
  archiveItem,
  createItem,
  type HoursDto,
  type ItemCreateInput,
  type ItemDto,
  type ItemHoursSetInput,
  type ItemSaveAsBundleInput,
  type ItemUpdateInput,
  saveItemAsBundle,
  setItemHours,
  updateItem,
} from "@bibi/core";
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

/** The item's own working hours; empty days and exceptions make it follow its venue (ADR 0064). */
export async function saveItemHoursAction({
  input,
}: {
  input: ItemHoursSetInput;
}): Promise<ActionResult<HoursDto>> {
  return toActionResult({ result: await runOperation({ operation: setItemHours, input }) });
}
