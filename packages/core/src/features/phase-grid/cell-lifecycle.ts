import type { OperationContext } from "../../operations/types";

const AUDITED_AS = "phaseStateRule";

export type ClearPhaseCellsInput = { context: OperationContext; phaseId: string };

/** Clears every cell of an archived phase (ADR 0044), audited per cell. */
export async function clearPhaseCells({ context, phaseId }: ClearPhaseCellsInput) {
  const cells = await context.db.phaseStateRule.findMany({ where: { phaseId } });
  if (cells.length === 0) return;
  await context.db.phaseStateRule.deleteMany({ where: { phaseId } });
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
  const cells = await context.db.phaseStateRule.findMany({ where: { stateId: fromStateId } });
  for (const before of cells) {
    if (toStateId === null) {
      await context.db.phaseStateRule.delete({ where: { id: before.id } });
      context.recordChange({ entityType: AUDITED_AS, entityId: before.id, before });
      continue;
    }
    const after = await context.db.phaseStateRule.update({
      where: { id: before.id },
      data: { stateId: toStateId },
    });
    context.recordChange({ entityType: AUDITED_AS, entityId: before.id, before, after });
  }
}
