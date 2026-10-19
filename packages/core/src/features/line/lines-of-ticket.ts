import type { OperationContext } from "../../operations/types";
import type { LineRecord } from "./schema";
import { LINE_INCLUDE, toLineRecord } from "./to-line-record";

export type TypedLine = { line: LineRecord; entityTypeId: string };

export type LinesOfTicketInput = {
  context: Pick<OperationContext, "db">;
  ticketId: string;
  /** Only lines that follow the phase grid (not overridden). */
  followingOnly?: boolean;
};

/**
 * The ticket's active lines that have an item and a state, each with its item's type (two
 * queries), in time order. Lines without an item have no state and are left out (ADR 0044).
 */
export async function linesOfTicket({
  context,
  ticketId,
  followingOnly = false,
}: LinesOfTicketInput): Promise<TypedLine[]> {
  const rows = await context.db.line.findMany({
    where: {
      ticketId,
      itemId: { not: null },
      stateId: { not: null },
      ...(followingOnly ? { stateOverridden: false } : {}),
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
