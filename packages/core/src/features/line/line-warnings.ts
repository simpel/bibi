import type { OperationContext } from "../../operations/types";
import type { LineWarning } from "./warning-schema";

export type LoadLineWarningsInput = {
  context: Pick<OperationContext, "db">;
  lineIds: readonly string[];
};

/**
 * The derived warnings of the lines, by line id (ADR 0059): one `UNFILLED_OPTIONAL_DEMAND` per
 * active allocation of an active optional demand that has no unit. One query for any number of
 * lines; nothing is stored.
 */
export async function loadLineWarnings({ context, lineIds }: LoadLineWarningsInput) {
  const byLine = new Map<string, LineWarning[]>();
  if (lineIds.length === 0) return byLine;
  const open = await context.db.lineAllocation.findMany({
    where: {
      lineId: { in: [...lineIds] },
      unitId: null,
      demand: { required: false, status: "ACTIVE" },
    },
    select: { id: true, lineId: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  for (const { id, lineId } of open) {
    const list = byLine.get(lineId) ?? [];
    list.push({ id, kind: "UNFILLED_OPTIONAL_DEMAND" });
    byLine.set(lineId, list);
  }
  return byLine;
}
