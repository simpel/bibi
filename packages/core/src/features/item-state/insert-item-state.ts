import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { loadItemState, loadStatesOfType } from "./load-item-state";
import type { ItemStateCreateInput, ItemStateDto, ItemStateFlags } from "./schema";
import {
  checkStateFlags,
  DEFAULT_FLAGS,
  handOverInitial,
  serializeStateChanges,
} from "./state-rules";

export type InsertItemStateInput = { context: OperationContext } & ItemStateCreateInput;

export const stateNameTaken = ({ name }: { name: string }) =>
  conflict({ message: `A state named "${name}" exists for this type` });

type LinkInput = { context: OperationContext; earlier: readonly ItemStateDto[]; id: string };

/**
 * The default transitions of a new (last) state (ADR 0044): every earlier state that is not
 * released may move forward to it, and it may move to every earlier released state. Audited on
 * each from-state.
 */
async function linkDefaultTransitions({ context, earlier, id }: LinkInput) {
  const created = await loadItemState({ context, id });
  if (!created) return;
  const into = earlier.filter((state) => !state.released);
  const out = created.released ? [] : earlier.filter((state) => state.released);
  const pairs = [
    ...into.map((state) => ({ fromStateId: state.id, toStateId: id })),
    ...out.map((state) => ({ fromStateId: id, toStateId: state.id })),
  ];
  const organizationId = context.organizationId;
  await context.db.itemStateTransition.createMany({
    data: pairs.map((pair) => ({ ...pair, organizationId })),
  });
  for (const before of into) {
    const after = { ...before, transitionsTo: [...before.transitionsTo, id] };
    context.recordChange({ entityType: "itemState", entityId: before.id, before, after });
  }
}

/** Shared by `itemState.create`, new item types and the seed: checks, insert, record. */
export async function insertItemState({
  context,
  ...input
}: InsertItemStateInput): Promise<Result<ItemStateDto>> {
  const { entityTypeId, name, color } = input;
  const type = await loadTypeOfBase({ context, entityTypeId, base: "ITEM" });
  if (!type.ok) return type;
  await serializeStateChanges({ context, entityTypeId });
  const earlier = await loadStatesOfType({ context, entityTypeId });
  if (earlier.some((state) => state.name === name)) return stateNameTaken({ name });
  const flags = flagsOf({ input });
  // The first state of a type is its initial state.
  if (earlier.length === 0) flags.initial = true;
  const bookable = type.value.capabilities.includes("BOOKABLE");
  const valid = checkStateFlags({ flags, bookable });
  if (!valid.ok) return valid;
  if (flags.initial) await handOverInitial({ context, entityTypeId, id: null });
  const position = (earlier.at(-1)?.position ?? -1) + 1;
  const row = await context.db.itemState.create({
    data: { ...flags, entityTypeId, name, color, position, organizationId: context.organizationId },
  });
  await linkDefaultTransitions({ context, earlier, id: row.id });
  const state = await loadItemState({ context, id: row.id });
  if (!state) return conflict({ message: "The state was archived concurrently" });
  context.recordChange({ entityType: "itemState", entityId: row.id, after: state });
  return ok({ value: state });
}

export type FlagsOfInput = { input: Partial<ItemStateFlags> };

/** The caller's flags over the defaults (all off, no hold). */
export const flagsOf = ({ input }: FlagsOfInput): ItemStateFlags => ({
  initial: input.initial ?? DEFAULT_FLAGS.initial,
  hold: input.hold ?? DEFAULT_FLAGS.hold,
  inSheets: input.inSheets ?? DEFAULT_FLAGS.inSheets,
  released: input.released ?? DEFAULT_FLAGS.released,
  expires: input.expires ?? DEFAULT_FLAGS.expires,
});
