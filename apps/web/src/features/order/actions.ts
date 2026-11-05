"use server";

import {
  changeOrderStatus,
  createOrder,
  type OrderChangeStatusInput,
  type OrderCreateInput,
  type OrderDto,
  type OrderPreviewLines,
  type OrderPreviewLinesInput,
  type OrderUpdateInput,
  type OrderViewDto,
  previewOrderLines,
  updateOrder,
  viewOrder,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateOrderActionInput = { input: OrderCreateInput };
export type UpdateOrderActionInput = { input: OrderUpdateInput };
export type ChangeOrderStatusActionInput = { input: OrderChangeStatusInput };

export async function createOrderAction({
  input,
}: CreateOrderActionInput): Promise<ActionResult<OrderDto>> {
  return toActionResult({ result: await runOperation({ operation: createOrder, input }) });
}

export async function updateOrderAction({
  input,
}: UpdateOrderActionInput): Promise<ActionResult<OrderDto>> {
  return toActionResult({ result: await runOperation({ operation: updateOrder, input }) });
}

export async function changeOrderStatusAction({
  input,
}: ChangeOrderStatusActionInput): Promise<ActionResult<OrderDto>> {
  return toActionResult({ result: await runOperation({ operation: changeOrderStatus, input }) });
}

export type PreviewOrderLinesActionInput = { input: OrderPreviewLinesInput };

/** Plans packages or draft lines without writing anything (`order.previewLines`, ADR 0081). */
export async function previewOrderLinesAction({
  input,
}: PreviewOrderLinesActionInput): Promise<ActionResult<OrderPreviewLines>> {
  return toActionResult({ result: await runOperation({ operation: previewOrderLines, input }) });
}

export type ViewOrderActionInput = { id: string };

export async function viewOrderAction({
  id,
}: ViewOrderActionInput): Promise<ActionResult<OrderViewDto>> {
  return toActionResult({ result: await runOperation({ operation: viewOrder, input: { id } }) });
}
