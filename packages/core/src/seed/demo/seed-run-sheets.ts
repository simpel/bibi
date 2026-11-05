import { ok, type Result } from "../../errors/result";
import { generateRunSheet } from "../../features/run-sheet/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";

/**
 * Generates every run sheet a seeded order has work for (ADR 0092): each active definition that
 * includes the item type of one of the order's active lines in an `inRunSheets` state. Orders
 * made without a line command since (e.g. from a predefined order) get their first version here;
 * an unchanged run sheet keeps its latest version, so running after the commands adds nothing.
 */
export async function seedDemoRunSheets({
  context,
}: {
  context: ExecuteContext;
}): Promise<Result<number>> {
  const definitions = await context.db.runSheetDefinition.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, entityTypes: { select: { entityTypeId: true } } },
  });
  let generated = 0;
  for (const definition of definitions) {
    const types = definition.entityTypes.map((row) => row.entityTypeId);
    const orders = await context.db.line.findMany({
      where: {
        status: "ACTIVE",
        state: { inRunSheets: true },
        item: { entityTypeId: { in: types } },
      },
      select: { orderId: true },
      distinct: ["orderId"],
    });
    for (const { orderId } of orders) {
      const input = { orderId, runSheetDefinitionId: definition.id };
      const result = await execute({ operation: generateRunSheet, input, context });
      if (!result.ok) return result;
      generated += 1;
    }
  }
  return ok({ value: generated });
}
