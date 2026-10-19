import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { loadItemState, loadStatesOfType } from "./load-item-state";
import {
  ItemStateListOutputSchema,
  ItemStateReorderInputSchema,
  ItemStateSchema,
  ItemStateSetTransitionsInputSchema,
} from "./schema";

const reorderProblem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "ids", message }] });

export const reorderItemStates = defineOperation({
  name: "itemState.reorder",
  kind: "command",
  description:
    "Set the order of one item type's states: pass every active state id of the type once, in " +
    "the new order. The order changes no transitions.",
  input: ItemStateReorderInputSchema,
  output: ItemStateListOutputSchema,
  permission: "pipeline:edit",
  // Each moved state is audited as an itemState change.
  entityType: "itemState",
  handler: async ({ input: { entityTypeId, ids }, context }) => {
    const current = await loadStatesOfType({ context, entityTypeId });
    const known = new Set(current.map((state) => state.id));
    const complete = ids.length === current.length && new Set(ids).size === ids.length;
    if (current.length === 0 || !complete || ids.some((id) => !known.has(id))) {
      return reorderProblem({ message: "List every active state of the type exactly once" });
    }
    for (const [position, id] of ids.entries()) {
      const before = current.find((state) => state.id === id);
      if (!before || before.position === position) continue;
      await context.db.itemState.update({ where: { id }, data: { position } });
      context.recordChange({ entityId: id, before, after: { ...before, position } });
    }
    const items = await loadStatesOfType({ context, entityTypeId });
    return ok({ value: { items, nextCursor: null } });
  },
});

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "toStateIds", message }] });

export const setItemStateTransitions = defineOperation({
  name: "itemState.setTransitions",
  kind: "command",
  description:
    "Replace the states a line may move to from one state (from → to), all of the same item " +
    "type. Pass the full set; an empty list makes the state a dead end. A released state is " +
    "always a dead end (ADR 0044).",
  input: ItemStateSetTransitionsInputSchema,
  output: ItemStateSchema,
  permission: "pipeline:edit",
  handler: async ({ input: { id, toStateIds }, context }) => {
    const before = await loadItemState({ context, id });
    if (!before) return notFound({ entity: "Item state" });
    const targets = [...new Set(toStateIds)];
    if (before.released && targets.length > 0) {
      return problem({ message: "A released state has no transitions out" });
    }
    if (targets.includes(id)) return problem({ message: "A state cannot move to itself" });
    const found = await context.db.itemState.count({
      where: { id: { in: targets }, entityTypeId: before.entityTypeId },
    });
    if (found !== targets.length) {
      return problem({ message: "Unknown or archived state, or a state of another type" });
    }
    await context.db.itemStateTransition.deleteMany({ where: { fromStateId: id } });
    await context.db.itemStateTransition.createMany({
      data: targets.map((toStateId) => ({
        organizationId: context.organizationId,
        fromStateId: id,
        toStateId,
      })),
    });
    const after = await loadItemState({ context, id });
    if (!after) return notFound({ entity: "Item state" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
