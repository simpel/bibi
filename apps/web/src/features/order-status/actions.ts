"use server";

import {
  archiveOrderStatus,
  createOrderStatus,
  importStatusGridTemplate,
  importOrderStatusTemplate,
  previewArchiveOrderStatus,
  reorderOrderStatuses,
  setOrderStatusGates,
  setOrderStatusTransitions,
  type OrderStatusArchiveInput,
  type OrderStatusCreateInput,
  type OrderStatusDto,
  type OrderStatusImportResult,
  type OrderStatusSetGatesInput,
  type OrderStatusSetTransitionsInput,
  type OrderStatusUpdateInput,
  updateOrderStatus,
} from "@bibi/core";
import type { ArchivePreview } from "@bibi/core/schemas";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateOrderStatusActionInput = { input: OrderStatusCreateInput };
export type UpdateOrderStatusActionInput = { input: OrderStatusUpdateInput };
export type ArchiveOrderStatusActionInput = { input: OrderStatusArchiveInput };
export type ReorderOrderStatusesActionInput = { ids: string[] };
export type SetTransitionsActionInput = { input: OrderStatusSetTransitionsInput };
export type SetGatesActionInput = { input: OrderStatusSetGatesInput };
type StatusPage = { items: OrderStatusDto[]; nextCursor: string | null };

export async function createOrderStatusAction({
  input,
}: CreateOrderStatusActionInput): Promise<ActionResult<OrderStatusDto>> {
  return toActionResult({ result: await runOperation({ operation: createOrderStatus, input }) });
}

export async function updateOrderStatusAction({
  input,
}: UpdateOrderStatusActionInput): Promise<ActionResult<OrderStatusDto>> {
  return toActionResult({ result: await runOperation({ operation: updateOrderStatus, input }) });
}

export async function archiveOrderStatusAction({
  input,
}: ArchiveOrderStatusActionInput): Promise<ActionResult<OrderStatusDto>> {
  const result = await runOperation({ operation: archiveOrderStatus, input });
  return toActionResult({ result });
}

/** `orderStatus.archivePreview`: what archiving would move and block; writes nothing. */
export async function previewArchiveOrderStatusAction({
  input,
}: ArchiveOrderStatusActionInput): Promise<ActionResult<ArchivePreview>> {
  const result = await runOperation({ operation: previewArchiveOrderStatus, input });
  return toActionResult({ result });
}

export async function reorderOrderStatusesAction({
  ids,
}: ReorderOrderStatusesActionInput): Promise<ActionResult<StatusPage>> {
  const result = await runOperation({ operation: reorderOrderStatuses, input: { ids } });
  return toActionResult({ result });
}

/** `orderStatus.setTransitions`: Allowed next, any status or only the chosen ones (ADR 0076). */
export async function setOrderStatusTransitionsAction({
  input,
}: SetTransitionsActionInput): Promise<ActionResult<OrderStatusDto>> {
  const result = await runOperation({ operation: setOrderStatusTransitions, input });
  return toActionResult({ result });
}

/** `orderStatus.setGates`: every requirement on moves into one status, by source (ADR 0076). */
export async function setOrderStatusGatesAction({
  input,
}: SetGatesActionInput): Promise<ActionResult<OrderStatusDto>> {
  const result = await runOperation({ operation: setOrderStatusGates, input });
  return toActionResult({ result });
}

/**
 * Imports the "Conference estate" statuses, then fills the status grid's empty cells from the
 * matching template; status names that already exist are skipped.
 */
export async function importOrderStatusTemplateAction(): Promise<
  ActionResult<OrderStatusImportResult>
> {
  const input = { template: "conference-estate" as const };
  const result = await runOperation({ operation: importOrderStatusTemplate, input });
  if (result.ok) await runOperation({ operation: importStatusGridTemplate, input });
  return toActionResult({ result });
}
