import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { handCellsOver } from "../phase-grid/cell-lifecycle";
import { moveLinesToState } from "./lines-in-state";
import { loadItemState, toItemStateDto } from "./load-item-state";
import { ItemStateArchiveInputSchema, type ItemStateDto, ItemStateSchema } from "./schema";
import { serializeStateChanges } from "./state-rules";

type TargetInput = { context: OperationContext; state: ItemStateDto; targetStateId?: string };

/** The target is another active state of the same type (`VALIDATION` on `targetStateId`). */
async function loadTarget({ context, state, targetStateId }: TargetInput) {
  const target = targetStateId ? await loadItemState({ context, id: targetStateId }) : null;
  if (target && target.id !== state.id && target.entityTypeId === state.entityTypeId) {
    return ok({ value: target });
  }
  const message = "Choose another state of the same type for the state's lines";
  return invalid({ message, issues: [{ path: "targetStateId", message }] });
}

/**
 * Lines move to the target; the type's expiry state and the grid cells that use the state follow
 * it or are cleared (ADR 0044).
 */
async function handOver({ context, state, targetStateId }: TargetInput): Promise<Result<true>> {
  const used = await context.db.programItem.count({ where: { stateId: state.id } });
  const target =
    used > 0 || targetStateId ? await loadTarget({ context, state, targetStateId }) : null;
  if (target && !target.ok) return target;
  const toStateId = target?.value.id ?? null;
  if (toStateId) {
    const moved = await moveLinesToState({ context, fromStateId: state.id, toStateId });
    if (!moved.ok) return moved;
  }
  await handCellsOver({ context, fromStateId: state.id, toStateId });
  const types = await context.db.entityType.findMany({ where: { expiryStateId: state.id } });
  for (const before of types) {
    const after = await context.db.entityType.update({
      where: { id: before.id },
      data: { expiryStateId: toStateId },
    });
    context.recordChange({ entityType: "entityType", entityId: before.id, before, after });
  }
  return ok({ value: true });
}

type DetachInput = { context: OperationContext; id: string };

/** Removes every transition into and out of the state, recorded on each state it left. */
async function detach({ context, id }: DetachInput) {
  const sources = await context.db.itemStateTransition.findMany({
    where: { toStateId: id },
    select: { fromStateId: true },
  });
  const befores = await Promise.all(
    sources.map(({ fromStateId }) => loadItemState({ context, id: fromStateId })),
  );
  await context.db.itemStateTransition.deleteMany({
    where: { OR: [{ toStateId: id }, { fromStateId: id }] },
  });
  for (const before of befores) {
    if (!before) continue;
    const after = { ...before, transitionsTo: before.transitionsTo.filter((to) => to !== id) };
    context.recordChange({ entityId: before.id, before, after });
  }
}

export const archiveItemState = defineOperation({
  name: "itemState.archive",
  kind: "command",
  description:
    "Archive an item state (states are never deleted). When lines use it, `targetStateId` (a " +
    "state of the same type) is required: the lines move there with their holds, all or none. " +
    "A type whose expiry state it was and the phase grid cells that use it get the target (or " +
    "are cleared). Its transitions are removed. " +
    "The initial state cannot be archived until another state is initial (CONFLICT).",
  input: ItemStateArchiveInputSchema,
  output: ItemStateSchema,
  permission: "itemState:admin",
  handler: async ({ input: { id, targetStateId }, context }) => {
    const found = await loadItemState({ context, id });
    if (!found) return notFound({ entity: "Item state" });
    await serializeStateChanges({ context, entityTypeId: found.entityTypeId });
    const before = await loadItemState({ context, id });
    if (!before) return notFound({ entity: "Item state" });
    if (before.initial) {
      return conflict({ message: "Make another state initial before archiving this one" });
    }
    const handed = await handOver({ context, state: before, targetStateId });
    if (!handed.ok) return handed;
    await detach({ context, id });
    const row = await context.db.itemState.update({ where: { id }, data: { status: "ARCHIVED" } });
    const after = toItemStateDto({ row: { ...row, transitionsFrom: [] } });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
