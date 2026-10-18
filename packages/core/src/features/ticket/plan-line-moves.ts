import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { loadStatesById } from "../item-state/load-item-state";
import { cellsOfPhase } from "../phase-grid/load-grid";
import { type LineMove, lineMoveBlockers } from "../program-item/line-move-check";
import { applyLineState } from "../program-item/line-state";
import { linesOfTicket } from "../program-item/lines-of-ticket";

export type LinePlan = { moves: LineMove[]; blockers: AppErrorIssue[] };

export type PlanLineMovesInput = {
  context: Pick<OperationContext, "db">;
  ticketId: string;
  phaseId: string;
};

/**
 * What entering a (non-terminal) phase does to the ticket's lines (ADR 0044), computed before
 * anything changes: every line that is not overridden and whose item type has a cell in the
 * phase moves to the cell's state; an empty cell keeps the state. `blockers` lists every line
 * whose move the type's transitions forbid or whose hard hold would collide.
 */
export async function planLineMoves({
  context,
  ticketId,
  phaseId,
}: PlanLineMovesInput): Promise<LinePlan> {
  const lines = await linesOfTicket({ context, ticketId, followingOnly: true });
  const entityTypeIds = [...new Set(lines.map((typed) => typed.entityTypeId))];
  const cells = await cellsOfPhase({ context, phaseId, entityTypeIds });
  const changing = lines.filter(({ line, entityTypeId }) => {
    const cell = cells.get(entityTypeId);
    return cell !== undefined && cell !== line.stateId;
  });
  const ids = changing.flatMap(({ line, entityTypeId }) => [
    ...(line.stateId ? [line.stateId] : []),
    cells.get(entityTypeId) ?? "",
  ]);
  const states = await loadStatesById({ context, ids });
  const plan: LinePlan = { moves: [], blockers: [] };
  for (const { line, entityTypeId } of changing) {
    const to = states.get(cells.get(entityTypeId) ?? "");
    if (!to) continue;
    const move = { line, from: line.stateId ? (states.get(line.stateId) ?? null) : null, to };
    const blockers = await lineMoveBlockers({ context, move });
    if (blockers.length > 0) plan.blockers.push(...blockers);
    else plan.moves.push(move);
  }
  return plan;
}

export type ApplyLineMovesInput = { context: OperationContext; moves: readonly LineMove[] };

/**
 * Applies planned moves one by one, audited per line; moves that take a hard hold go last, so
 * holds the ticket gives up are free first. The caller's transaction rolls back on an error.
 */
export async function applyLineMoves({
  context,
  moves,
}: ApplyLineMovesInput): Promise<Result<true>> {
  const ordered = [...moves].sort(
    (a, b) => Number(a.to.hold === "HARD") - Number(b.to.hold === "HARD"),
  );
  for (const { line, to } of ordered) {
    const moved = await applyLineState({ context, before: line, stateId: to.id });
    if (!moved.ok) return moved;
  }
  return ok({ value: true });
}
