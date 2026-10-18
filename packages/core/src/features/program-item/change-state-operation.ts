import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { loadItemState } from "../item-state/load-item-state";
import type { ItemStateDto } from "../item-state/schema";
import { lineMoveBlockers } from "./line-move-check";
import { applyLineState, itemTypeOf } from "./line-state";
import { LineChangeStateInputSchema, type ProgramItemDto, ProgramItemSchema } from "./schema";
import { loadProgramItem, toProgramItemDto } from "./to-program-item-dto";

type TargetInput = { context: Pick<OperationContext, "db">; line: ProgramItemDto; id: string };

/** The target state: an active state of the line's item type (`VALIDATION` otherwise). */
async function loadTarget({ context, line, id }: TargetInput): Promise<Result<ItemStateDto>> {
  const entityTypeId = await itemTypeOf({ context, itemId: line.itemId });
  if (!entityTypeId) {
    const message = "Only a line with an item has a state";
    return invalid({ message, issues: [{ path: "lineId", message }] });
  }
  const state = await loadItemState({ context, id });
  if (state && state.entityTypeId === entityTypeId) return ok({ value: state });
  const message = "Unknown state for the line's item type";
  return invalid({ message, issues: [{ path: "stateId", message }] });
}

export const changeLineState = defineOperation({
  name: "line.changeState",
  kind: "command",
  description:
    "Set one line (program item with an item) to a state of its item type, e.g. order a drink " +
    "while the ticket is still a lead (ADR 0044). The move must be allowed by the type's " +
    "transitions (CONFLICT otherwise). The line becomes overridden: phase moves skip it until " +
    "line.followPhase. Its hold follows the new state; a collision with a hard hold gives " +
    "CONFLICT naming the blocker.",
  input: LineChangeStateInputSchema,
  output: ProgramItemSchema,
  permission: "programItem:write",
  entityType: "programItem",
  handler: async ({ input: { lineId, stateId }, context }) => {
    const line = await loadProgramItem({ context, id: lineId });
    if (!line) return notFound({ entity: "Line" });
    const target = await loadTarget({ context, line, id: stateId });
    if (!target.ok) return target;
    if (line.stateId === stateId) {
      const row = await context.db.programItem.update({
        where: { id: lineId },
        data: { stateOverridden: true },
      });
      const after = toProgramItemDto({ row });
      context.recordChange({ entityId: lineId, before: line, after });
      return ok({ value: after });
    }
    const from = line.stateId ? await loadItemState({ context, id: line.stateId }) : null;
    const issues = await lineMoveBlockers({ context, move: { line, from, to: target.value } });
    if (issues.length > 0) {
      return conflict({ message: `"${line.name}" cannot move to ${target.value.name}`, issues });
    }
    return applyLineState({ context, before: line, stateId, overridden: true });
  },
});
