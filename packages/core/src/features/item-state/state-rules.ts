import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { ItemStateFlags } from "./schema";

const problem = ({ path, message }: { path: string; message: string }) =>
  invalid({ message, issues: [{ path, message }] });

export type CheckStateFlagsInput = { flags: ItemStateFlags; bookable: boolean };

/**
 * Flags that contradict each other or the type (ADR 0044): only `BOOKABLE` types hold their
 * items, and a released state is final, so it holds nothing, never expires and is not initial.
 */
export function checkStateFlags({ flags, bookable }: CheckStateFlagsInput): Result<true> {
  if (flags.hold !== "NONE" && !bookable) {
    return problem({ path: "hold", message: "Only states of a bookable type can hold the item" });
  }
  if (!flags.released) return ok({ value: true });
  if (flags.hold !== "NONE") {
    return problem({ path: "hold", message: "A released state holds nothing" });
  }
  if (flags.expires) return problem({ path: "expires", message: "A released state never expires" });
  if (flags.initial) {
    return problem({ path: "initial", message: "The initial state cannot be released" });
  }
  return ok({ value: true });
}

export const DEFAULT_FLAGS: ItemStateFlags = {
  initial: false,
  hold: "NONE",
  inSheets: false,
  released: false,
  expires: false,
};

export type HandOverInitialInput = {
  context: OperationContext;
  entityTypeId: string;
  /** The state that becomes initial; null for one that is about to be created. */
  id: string | null;
};

/**
 * Exactly one state per type is initial (ADR 0044, a unique index): making a state initial takes
 * the flag from the one that had it first. Audited on the state that loses it.
 */
export async function handOverInitial({ context, entityTypeId, id }: HandOverInitialInput) {
  const previous = await context.db.itemState.findMany({
    where: { entityTypeId, initial: true, ...(id ? { id: { not: id } } : {}) },
  });
  for (const row of previous) {
    await context.db.itemState.update({ where: { id: row.id }, data: { initial: false } });
    const after = { ...row, initial: false };
    context.recordChange({ entityType: "itemState", entityId: row.id, before: row, after });
  }
}

export type SerializeStatesInput = { context: Pick<OperationContext, "db">; entityTypeId: string };

/**
 * Serializes changes to one type's states (ADR 0044): taking the row lock of the type's initial
 * state first makes concurrent updates and archives check "one initial state" one after the
 * other. A type without states has nothing to lock; the unique index on `initial` guards it.
 */
export async function serializeStateChanges({ context, entityTypeId }: SerializeStatesInput) {
  await context.db.itemState.updateMany({
    where: { entityTypeId, initial: true },
    data: { initial: true },
  });
}
