import type { OperationContext } from "../../operations/types";

type Db = { context: Pick<OperationContext, "db"> };

/**
 * The active responsibilities that apply to each ticket (ADR 0055): those covering the item type
 * of one of its active lines. Derived on every read; nothing is stored when lines change.
 */
export async function applicableResponsibilityIds({
  context,
  ticketIds,
}: Db & { ticketIds: readonly string[] }): Promise<Map<string, Set<string>>> {
  const found = new Map<string, Set<string>>();
  if (ticketIds.length === 0) return found;
  const lines = await context.db.line.findMany({
    where: { ticketId: { in: [...ticketIds] }, status: "ACTIVE", itemId: { not: null } },
    select: { ticketId: true, item: { select: { entityTypeId: true } } },
  });
  const typesOf = new Map<string, Set<string>>();
  for (const { ticketId, item } of lines) {
    if (item) typesOf.set(ticketId, (typesOf.get(ticketId) ?? new Set()).add(item.entityTypeId));
  }
  const covers = await context.db.responsibilityEntityType.findMany({
    where: {
      entityTypeId: { in: [...new Set([...typesOf.values()].flatMap((types) => [...types]))] },
      responsibility: { status: "ACTIVE" },
    },
    select: { responsibilityId: true, entityTypeId: true },
  });
  for (const [ticketId, types] of typesOf) {
    const ids = covers.filter((c) => types.has(c.entityTypeId)).map((c) => c.responsibilityId);
    if (ids.length > 0) found.set(ticketId, new Set(ids));
  }
  return found;
}
