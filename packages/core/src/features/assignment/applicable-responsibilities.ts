import type { OperationContext } from "../../operations/types";

type Db = { context: Pick<OperationContext, "db"> };

/**
 * The active responsibilities that apply to each order (ADR 0055): those covering the item type
 * of one of its active lines. Derived on every read; nothing is stored when lines change.
 */
export async function applicableResponsibilityIds({
  context,
  orderIds,
}: Db & { orderIds: readonly string[] }): Promise<Map<string, Set<string>>> {
  const found = new Map<string, Set<string>>();
  if (orderIds.length === 0) return found;
  const lines = await context.db.line.findMany({
    where: { orderId: { in: [...orderIds] }, status: "ACTIVE", itemId: { not: null } },
    select: { orderId: true, item: { select: { entityTypeId: true } } },
  });
  const typesOf = new Map<string, Set<string>>();
  for (const { orderId, item } of lines) {
    if (item) typesOf.set(orderId, (typesOf.get(orderId) ?? new Set()).add(item.entityTypeId));
  }
  const covers = await context.db.responsibilityEntityType.findMany({
    where: {
      entityTypeId: { in: [...new Set([...typesOf.values()].flatMap((types) => [...types]))] },
      responsibility: { status: "ACTIVE" },
    },
    select: { responsibilityId: true, entityTypeId: true },
  });
  for (const [orderId, types] of typesOf) {
    const ids = covers.filter((c) => types.has(c.entityTypeId)).map((c) => c.responsibilityId);
    if (ids.length > 0) found.set(orderId, new Set(ids));
  }
  return found;
}
