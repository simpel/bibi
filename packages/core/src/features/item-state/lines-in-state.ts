import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { applyLineState } from "../line/line-state";
import { toLineRecord } from "../line/to-line-record";

export type MoveLinesInput = { context: OperationContext; fromStateId: string; toStateId: string };

/**
 * Moves every active line of one state to another of the same type (archiving a state, ADR
 * 0044), each audited and with its hold derived again. Returns how many lines moved.
 */
export async function moveLinesToState({
  context,
  fromStateId,
  toStateId,
}: MoveLinesInput): Promise<Result<number>> {
  const rows = await context.db.line.findMany({ where: { stateId: fromStateId } });
  for (const row of rows) {
    const before = toLineRecord({ row });
    const moved = await applyLineState({ context, before, stateId: toStateId });
    if (!moved.ok) return moved;
  }
  return ok({ value: rows.length });
}
