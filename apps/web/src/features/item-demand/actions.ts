"use server";

import {
  archiveItemDemand,
  createItemDemand,
  type ItemDemandCreateInput,
  type ItemDemandDto,
  type ItemDemandUpdateInput,
  updateItemDemand,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateItemDemandActionInput = { input: ItemDemandCreateInput };
export type UpdateItemDemandActionInput = { input: ItemDemandUpdateInput };
export type ArchiveItemDemandActionInput = { id: string };

export async function createItemDemandAction({
  input,
}: CreateItemDemandActionInput): Promise<ActionResult<ItemDemandDto>> {
  return toActionResult({ result: await runOperation({ operation: createItemDemand, input }) });
}

export async function updateItemDemandAction({
  input,
}: UpdateItemDemandActionInput): Promise<ActionResult<ItemDemandDto>> {
  return toActionResult({ result: await runOperation({ operation: updateItemDemand, input }) });
}

export async function archiveItemDemandAction({
  id,
}: ArchiveItemDemandActionInput): Promise<ActionResult<ItemDemandDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveItemDemand, input: { id } }),
  });
}
