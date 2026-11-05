import type { OperationContext } from "../../operations/types";
import type { LineRecord } from "./schema";
import { LINE_INCLUDE, toLineRecord } from "./to-line-record";

export type TypedLine = { line: LineRecord; entityTypeId: string };

export type LinesOfOrderInput = {
  context: Pick<OperationContext, "db">;
  orderId: string;
  /** Only lines that follow the status grid (not overridden). */
  followingOnly?: boolean;
  /** Only these lines of the order. */
  lineIds?: readonly string[];
};

/**
 * The order's active lines that have an item and a state, each with its item's type (two
 * queries), in time order. Lines without an item have no state and are left out (ADR 0044).
 */
export async function linesOfOrder({
  context,
  orderId,
  followingOnly = false,
  lineIds,
}: LinesOfOrderInput): Promise<TypedLine[]> {
  const rows = await context.db.line.findMany({
    where: {
      orderId,
      itemId: { not: null },
      stateId: { not: null },
      ...(followingOnly ? { stateOverridden: false } : {}),
      ...(lineIds ? { id: { in: [...lineIds] } } : {}),
    },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    include: LINE_INCLUDE,
  });
  const itemIds = [...new Set(rows.flatMap((row) => (row.itemId ? [row.itemId] : [])))];
  const items = await context.db.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, entityTypeId: true },
  });
  const typeOf = new Map(items.map((item) => [item.id, item.entityTypeId]));
  return rows.flatMap((row) => {
    const entityTypeId = row.itemId ? typeOf.get(row.itemId) : undefined;
    return entityTypeId ? [{ line: toLineRecord({ row }), entityTypeId }] : [];
  });
}
