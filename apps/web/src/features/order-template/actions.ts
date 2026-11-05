"use server";

import {
  archiveOrderTemplate,
  createOrderTemplate,
  type OrderTemplateCreateInput,
  type OrderTemplateDto,
  type OrderTemplateUpdateInput,
  updateOrderTemplate,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateOrderTemplateActionInput = { input: OrderTemplateCreateInput };
export type UpdateOrderTemplateActionInput = { input: OrderTemplateUpdateInput };
export type ArchiveOrderTemplateActionInput = { id: string };

export async function createOrderTemplateAction({
  input,
}: CreateOrderTemplateActionInput): Promise<ActionResult<OrderTemplateDto>> {
  return toActionResult({ result: await runOperation({ operation: createOrderTemplate, input }) });
}

export async function updateOrderTemplateAction({
  input,
}: UpdateOrderTemplateActionInput): Promise<ActionResult<OrderTemplateDto>> {
  return toActionResult({ result: await runOperation({ operation: updateOrderTemplate, input }) });
}

export async function archiveOrderTemplateAction({
  id,
}: ArchiveOrderTemplateActionInput): Promise<ActionResult<OrderTemplateDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveOrderTemplate, input: { id } }),
  });
}
