"use server";

import {
  generateWorkOrder,
  sendWorkOrder,
  type WorkOrderDto,
  type WorkOrderGenerateInput,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type GenerateWorkOrderActionInput = { input: WorkOrderGenerateInput };
export type SendWorkOrderActionInput = { id: string };

export async function generateWorkOrderAction({
  input,
}: GenerateWorkOrderActionInput): Promise<ActionResult<WorkOrderDto>> {
  return toActionResult({ result: await runOperation({ operation: generateWorkOrder, input }) });
}

export async function sendWorkOrderAction({
  id,
}: SendWorkOrderActionInput): Promise<ActionResult<WorkOrderDto>> {
  return toActionResult({
    result: await runOperation({ operation: sendWorkOrder, input: { id } }),
  });
}
