import { ok, type Result } from "../../errors/result";
import { generateWorkOrder } from "../../features/work-order/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";

/**
 * Generates every work order a seeded ticket has work for (ADR 0092): each active definition that
 * includes the item type of one of the ticket's active lines in an `inWorkOrders` state. Tickets
 * made without a line command since (e.g. from a predefined ticket) get their first version here;
 * an unchanged work order keeps its latest version, so running after the commands adds nothing.
 */
export async function seedDemoWorkOrders({
  context,
}: {
  context: ExecuteContext;
}): Promise<Result<number>> {
  const definitions = await context.db.workOrderDefinition.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, entityTypes: { select: { entityTypeId: true } } },
  });
  let generated = 0;
  for (const definition of definitions) {
    const types = definition.entityTypes.map((row) => row.entityTypeId);
    const tickets = await context.db.line.findMany({
      where: {
        status: "ACTIVE",
        state: { inWorkOrders: true },
        item: { entityTypeId: { in: types } },
      },
      select: { ticketId: true },
      distinct: ["ticketId"],
    });
    for (const { ticketId } of tickets) {
      const input = { ticketId, workOrderDefinitionId: definition.id };
      const result = await execute({ operation: generateWorkOrder, input, context });
      if (!result.ok) return result;
      generated += 1;
    }
  }
  return ok({ value: generated });
}
