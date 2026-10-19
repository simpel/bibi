import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { handCellsOver } from "../phase-grid/cell-lifecycle";
import { moveLinesToState } from "./lines-in-state";
import { loadItemState, toItemStateDto } from "./load-item-state";
import type { ItemStateArchiveInput, ItemStateDto } from "./schema";
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

export type ArchiveStateInput = { context: OperationContext; input: ItemStateArchiveInput };

/**
 * The whole archive (ADR 0044): checks, line moves, grid cells, expiry state and transitions.
 * Shared by `itemState.archive` and its dry run `itemState.archivePreview`.
 */
export async function archiveState({ context, input }: ArchiveStateInput) {
  const { id, targetStateId } = input;
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
}
