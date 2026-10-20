import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { loadItemState } from "../item-state/load-item-state";
import { cellsOfPhase } from "../phase-grid/load-grid";
import { lineMoveBlockers } from "./line-move-check";
import { applyLineState, itemTypeOf } from "./line-state";
import { LineFollowPhaseInputSchema, type ProgramItemDto, ProgramItemSchema } from "./schema";
import { loadProgramItem, toProgramItemDto } from "./to-program-item-dto";

type Db = { context: Pick<OperationContext, "db"> };

/**
 * The state the current phase's cell gives the line, or null when it keeps its state: no item,
 * an empty cell, or a terminal phase (which already released the line).
 */
async function cellStateOf({ context, line }: Db & { line: ProgramItemDto }) {
  const entityTypeId = await itemTypeOf({ context, itemId: line.itemId });
  if (!entityTypeId) return null;
  const ticket = await context.db.ticket.findFirst({
    where: { id: line.ticketId },
    select: { phase: { select: { id: true, terminal: true } } },
  });
  if (!ticket || ticket.phase.terminal) return null;
  const cells = await cellsOfPhase({
    context,
    phaseId: ticket.phase.id,
    entityTypeIds: [entityTypeId],
  });
  return cells.get(entityTypeId) ?? null;
}

type ClearInput = { context: OperationContext; line: ProgramItemDto };

/** Clears the override and keeps the state. */
async function clearOverride({ context, line }: ClearInput): Promise<Result<ProgramItemDto>> {
  if (!line.stateOverridden) return ok({ value: line });
  const row = await context.db.programItem.update({
    where: { id: line.id },
    data: { stateOverridden: false },
  });
  const after = toProgramItemDto({ row });
  context.recordChange({ entityId: line.id, before: line, after });
  return ok({ value: after });
}

export const followLinePhase = defineOperation({
  name: "line.followPhase",
  kind: "command",
  description:
    "Undo a line's override (line.changeState): the line follows the phase grid again and moves " +
    "to the state of the current phase's cell for its item type (an empty cell keeps the " +
    "state). The move must be allowed by the type's transitions and a hard hold must not " +
    "collide; otherwise CONFLICT names the blockers and nothing changes.",
  input: LineFollowPhaseInputSchema,
  output: ProgramItemSchema,
  permission: "program:write",
  entityType: "programItem",
  handler: async ({ input: { lineId }, context }) => {
    const line = await loadProgramItem({ context, id: lineId });
    if (!line) return notFound({ entity: "Line" });
    const stateId = await cellStateOf({ context, line });
    if (!stateId || stateId === line.stateId) return clearOverride({ context, line });
    const to = await loadItemState({ context, id: stateId });
    if (!to) return clearOverride({ context, line });
    const from = line.stateId ? await loadItemState({ context, id: line.stateId }) : null;
    const issues = await lineMoveBlockers({ context, move: { line, from, to } });
    if (issues.length > 0) {
      return conflict({ message: `"${line.name}" cannot follow the phase to ${to.name}`, issues });
    }
    return applyLineState({ context, before: line, stateId, overridden: false });
  },
});
