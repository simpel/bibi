"use server";

import {
  archivePriceList,
  createPriceList,
  type PriceListCreateInput,
  type PriceListDto,
  type PriceListSetItemsInput,
  type PriceListUpdateInput,
  setPriceListItems,
  updatePriceList,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreatePriceListActionInput = { input: PriceListCreateInput };
export type UpdatePriceListActionInput = { input: PriceListUpdateInput };
export type SetPriceListItemsActionInput = { input: PriceListSetItemsInput };
export type ArchivePriceListActionInput = { id: string };

export async function createPriceListAction({
  input,
}: CreatePriceListActionInput): Promise<ActionResult<PriceListDto>> {
  return toActionResult({ result: await runOperation({ operation: createPriceList, input }) });
}

export async function updatePriceListAction({
  input,
}: UpdatePriceListActionInput): Promise<ActionResult<PriceListDto>> {
  return toActionResult({ result: await runOperation({ operation: updatePriceList, input }) });
}

export async function setPriceListItemsAction({
  input,
}: SetPriceListItemsActionInput): Promise<ActionResult<PriceListDto>> {
  return toActionResult({ result: await runOperation({ operation: setPriceListItems, input }) });
}

export async function archivePriceListAction({
  id,
}: ArchivePriceListActionInput): Promise<ActionResult<PriceListDto>> {
  const result = await runOperation({ operation: archivePriceList, input: { id } });
  return toActionResult({ result });
}
