import { ok, type Result } from "../../errors/result";
import { setStatusGridCell } from "../../features/status-grid/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { missing } from "./seed-fields";
import type { DemoGridCell } from "./types";

export type SeedGridInput = { context: ExecuteContext; cells: readonly DemoGridCell[] };

type CellInput = { context: ExecuteContext; cell: DemoGridCell };

/** Status, item type and state ids of one cell, or the first name the data gets wrong. */
async function resolveCell({ context, cell }: CellInput) {
  const ticketStatus = await context.db.ticketStatus.findFirst({
    where: { name: cell.ticketStatus },
  });
  if (!ticketStatus) return missing({ what: `ticket status ${cell.ticketStatus}` });
  const type = await context.db.entityType.findFirst({ where: { name: cell.type, base: "ITEM" } });
  if (!type) return missing({ what: `item type ${cell.type}` });
  const state = await context.db.itemState.findFirst({
    where: { name: cell.state, entityTypeId: type.id },
  });
  if (!state) return missing({ what: `state ${cell.state} of ${cell.type}` });
  return ok({ value: { statusId: ticketStatus.id, entityTypeId: type.id, stateId: state.id } });
}

/** The status grid (ADR 0044) via `statusGrid.setCell` as SYSTEM, before any line is created. */
export async function seedDemoGrid({ context, cells }: SeedGridInput): Promise<Result<true>> {
  for (const cell of cells) {
    const input = await resolveCell({ context, cell });
    if (!input.ok) return input;
    const set = await execute({ operation: setStatusGridCell, input: input.value, context });
    if (!set.ok) return set;
  }
  return ok({ value: true });
}
