"use server";

import {
  archiveItemTypeGroup,
  createItemTypeGroup,
  type ItemTypeGroupDto,
  reorderItemTypeGroups,
  updateItemTypeGroup,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateItemTypeGroupActionInput = { name: string };
export type UpdateItemTypeGroupActionInput = { id: string; name: string };
export type ReorderItemTypeGroupsActionInput = { ids: string[] };
export type ArchiveItemTypeGroupActionInput = { id: string };

export async function createItemTypeGroupAction({
  name,
}: CreateItemTypeGroupActionInput): Promise<ActionResult<ItemTypeGroupDto>> {
  return toActionResult({
    result: await runOperation({ operation: createItemTypeGroup, input: { name } }),
  });
}

export async function updateItemTypeGroupAction({
  id,
  name,
}: UpdateItemTypeGroupActionInput): Promise<ActionResult<ItemTypeGroupDto>> {
  return toActionResult({
    result: await runOperation({ operation: updateItemTypeGroup, input: { id, name } }),
  });
}

export async function reorderItemTypeGroupsAction({
  ids,
}: ReorderItemTypeGroupsActionInput): Promise<ActionResult<unknown>> {
  return toActionResult({
    result: await runOperation({ operation: reorderItemTypeGroups, input: { ids } }),
  });
}

export async function archiveItemTypeGroupAction({
  id,
}: ArchiveItemTypeGroupActionInput): Promise<ActionResult<ItemTypeGroupDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveItemTypeGroup, input: { id } }),
  });
}
