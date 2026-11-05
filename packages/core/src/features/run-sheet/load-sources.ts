import type { Order } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import type { RunSheetDefinitionDto } from "../run-sheet-definition/schema";
import { findRunSheetDefinition } from "../run-sheet-definition/run-sheet-definition-rows";

export type Sources = { order: Order; definition: RunSheetDefinitionDto };
export type LoadSourcesInput = {
  context: Pick<OperationContext, "db">;
  orderId: string;
  runSheetDefinitionId: string;
};

/** The order and the active definition, or `NOT_FOUND`; the receiving responsibility is active. */
export async function loadSources({
  context,
  orderId,
  runSheetDefinitionId,
}: LoadSourcesInput): Promise<Result<Sources>> {
  const order = await context.db.order.findFirst({ where: { id: orderId } });
  if (!order) return notFound({ entity: "Order" });
  const definition = await findRunSheetDefinition({ context, id: runSheetDefinitionId });
  if (!definition) return notFound({ entity: "Run sheet definition" });
  const { responsibilityId } = definition;
  if ((await context.db.responsibility.count({ where: { id: responsibilityId } })) === 0) {
    const message = "The run sheet goes to a responsibility that is archived";
    return invalid({ message, issues: [{ path: "runSheetDefinitionId", message }] });
  }
  return ok({ value: { order, definition } });
}
