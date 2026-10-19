import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { flagsOf, insertItemState, stateNameTaken } from "./insert-item-state";
import { rederiveLinesInState } from "./lines-in-state";
import { loadItemState, loadStatesOfType } from "./load-item-state";
import {
  ItemStateCreateInputSchema,
  type ItemStateDto,
  type ItemStateFlags,
  ItemStateSchema,
  ItemStateUpdateInputSchema,
} from "./schema";
import { checkStateFlags, handOverInitial, serializeStateChanges } from "./state-rules";

export const createItemState = defineOperation({
  name: "itemState.create",
  kind: "command",
  description:
    "Create a state for lines of one item type (ADR 0044): a name, a hex color and its flags " +
    "(initial, hold NONE/SOFT/HARD, inSheets, released, expires; off and NONE by default). It " +
    "is placed last. The first state of a type is its initial state; a new initial state takes " +
    "the flag from the current one. By default every earlier state may move to it and it may " +
    "move to every released state; change that with itemState.setTransitions.",
  input: ItemStateCreateInputSchema,
  output: ItemStateSchema,
  permission: "pipeline:create",
  handler: ({ input, context }) => insertItemState({ context, ...input }),
});

type EffectsInput = { context: OperationContext; before: ItemStateDto; flags: ItemStateFlags };

/** Side effects of new flags: the initial flag moves here, a released state loses its exits. */
async function applyFlagEffects({ context, before, flags }: EffectsInput) {
  const { entityTypeId, id } = before;
  if (flags.initial && !before.initial) await handOverInitial({ context, entityTypeId, id });
  if (flags.released && !before.released) {
    await context.db.itemStateTransition.deleteMany({ where: { fromStateId: id } });
  }
}

type CheckInput = { context: OperationContext; before: ItemStateDto; flags: ItemStateFlags };

async function checkUpdate({ context, before, flags }: CheckInput) {
  if (before.initial && !flags.initial) {
    return conflict({ message: "A type needs an initial state: make another state initial" });
  }
  const type = await context.db.entityType.findFirst({ where: { id: before.entityTypeId } });
  const bookable = type?.behaviours.includes("BOOKABLE") ?? false;
  return checkStateFlags({ flags, bookable });
}

export const updateItemState = defineOperation({
  name: "itemState.update",
  kind: "command",
  description:
    "Rename or recolor an item state, or change its flags. Renaming and recoloring change no " +
    "behavior. Making a state initial takes the flag from the current one; making it released " +
    "removes its transitions out. Changing `hold` or `released` re-derives the holds of every " +
    "line in the state; a collision with a hard hold gives CONFLICT and changes nothing.",
  input: ItemStateUpdateInputSchema,
  output: ItemStateSchema,
  permission: "pipeline:edit",
  handler: async ({ input: { id, ...data }, context }) => {
    const found = await loadItemState({ context, id });
    if (!found) return notFound({ entity: "Item state" });
    await serializeStateChanges({ context, entityTypeId: found.entityTypeId });
    const before = await loadItemState({ context, id });
    if (!before) return notFound({ entity: "Item state" });
    const { name } = data;
    if (name !== undefined && name !== before.name) {
      const states = await loadStatesOfType({ context, entityTypeId: before.entityTypeId });
      if (states.some((state) => state.name === name)) return stateNameTaken({ name });
    }
    const flags = flagsOf({ input: { ...before, ...stripUnset({ data }) } });
    const valid = await checkUpdate({ context, before, flags });
    if (!valid.ok) return valid;
    await applyFlagEffects({ context, before, flags });
    await context.db.itemState.update({ where: { id }, data });
    if (flags.hold !== before.hold || flags.released !== before.released) {
      const held = await rederiveLinesInState({ context, stateId: id });
      if (!held.ok) return held;
    }
    const after = await loadItemState({ context, id });
    if (!after) return notFound({ entity: "Item state" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

/** The flags the caller set (`undefined` keeps the current value). */
const stripUnset = ({ data }: { data: Partial<ItemStateFlags> }): Partial<ItemStateFlags> =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
