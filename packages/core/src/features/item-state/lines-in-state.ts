import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { applyLineState } from "../line/line-state";
import { rederiveLine } from "../line/reserve";
import { toLineRecord } from "../line/to-line-record";

export type RederiveInput = { context: OperationContext; stateId: string };

/** Derives the hold of every active line in the state again, after its hold flags changed. */
export async function rederiveLinesInState({ context, stateId }: RederiveInput) {
  const rows = await context.db.line.findMany({ where: { stateId } });
  for (const row of rows) {
    const held = await rederiveLine({ context, line: toLineRecord({ row }) });
    if (!held.ok) return held;
  }
  return ok({ value: true });
}

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
