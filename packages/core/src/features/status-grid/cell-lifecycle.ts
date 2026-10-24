import type { OperationContext } from "../../operations/types";

const AUDITED_AS = "statusStateRule";

export type ClearStatusCellsInput = { context: OperationContext; statusId: string };

/** Clears every cell of an archived status (ADR 0044), audited per cell. */
export async function clearStatusCells({ context, statusId }: ClearStatusCellsInput) {
  const cells = await context.db.statusStateRule.findMany({ where: { statusId } });
  if (cells.length === 0) return;
  await context.db.statusStateRule.deleteMany({ where: { statusId } });
  for (const before of cells) {
    context.recordChange({ entityType: AUDITED_AS, entityId: before.id, before });
  }
}

export type HandCellsOverInput = {
  context: OperationContext;
  fromStateId: string;
  /** Another state of the same type, or null to clear the cells ("keep"). */
  toStateId: string | null;
};

/**
 * The cells that point at an archived state move with its lines to the target state, or are
 * cleared without one (ADR 0044). Audited per cell.
 */
export async function handCellsOver({ context, fromStateId, toStateId }: HandCellsOverInput) {
  const cells = await context.db.statusStateRule.findMany({ where: { stateId: fromStateId } });
  for (const before of cells) {
    if (toStateId === null) {
      await context.db.statusStateRule.delete({ where: { id: before.id } });
      context.recordChange({ entityType: AUDITED_AS, entityId: before.id, before });
      continue;
    }
    const after = await context.db.statusStateRule.update({
      where: { id: before.id },
      data: { stateId: toStateId },
    });
    context.recordChange({ entityType: AUDITED_AS, entityId: before.id, before, after });
  }
}
