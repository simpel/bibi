import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { applyLineState } from "./line-state";
import { linesOfTicket } from "./lines-of-ticket";

type Db = { context: Pick<OperationContext, "db"> };

/** The first active released state of each item type: type id → state id. */
async function releasedStates({ context, entityTypeIds }: Db & { entityTypeIds: string[] }) {
  const rows = await context.db.itemState.findMany({
    where: { entityTypeId: { in: entityTypeIds }, released: true },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true, entityTypeId: true },
  });
  const byType = new Map<string, string>();
  for (const row of rows) if (!byType.has(row.entityTypeId)) byType.set(row.entityTypeId, row.id);
  return { byType, ids: new Set(rows.map((row) => row.id)) };
}

export type ReleaseLineStatesInput = {
  context: OperationContext;
  ticketId: string;
  /** Only these lines of the ticket (e.g. the options not chosen, ADR 0052). */
  lineIds?: readonly string[];
  /** Mark the moved lines as overridden, so phase moves skip them (an explicit release). */
  overridden?: boolean;
};

/**
 * Moves every line of the ticket that is not yet in a released state to its item type's released
 * state (ADR 0044), audited per line. A type without a released state keeps the line's state; it holds
 * nothing anyway once the ticket is in a terminal phase (ADR 0053).
 */
export async function releaseLineStates({
  context,
  ticketId,
  lineIds,
  overridden,
}: ReleaseLineStatesInput): Promise<Result<true>> {
  const lines = await linesOfTicket({ context, ticketId, lineIds });
  const entityTypeIds = [...new Set(lines.map((typed) => typed.entityTypeId))];
  const released = await releasedStates({ context, entityTypeIds });
  for (const { line, entityTypeId } of lines) {
    const stateId = released.byType.get(entityTypeId);
    if (!stateId || (line.stateId && released.ids.has(line.stateId))) continue;
    const moved = await applyLineState({
      context,
      before: line,
      stateId,
      trigger: overridden ? "MANUAL" : "PHASE",
      overridden,
    });
    if (!moved.ok) return moved;
  }
  return ok({ value: true });
}
