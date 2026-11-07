import type { ItemStateDto } from "@bibi/core/schemas";
import { STATE_FLAGS } from "@bibi/core/schemas";

export type StateFlagKey = (typeof STATE_FLAGS)[number] | "hold";

/** One table row: a state with the names it may move to and the flags it has (ADR 0044). */
export type StateRow = {
  state: ItemStateDto;
  index: number;
  targets: string[];
  flags: StateFlagKey[];
};

export type ToStateRowsInput = { states: readonly ItemStateDto[] };

/** The flags a state has: the booleans that are on, plus `hold` unless it is NONE. */
export function flagsOf({ state }: { state: ItemStateDto }): StateFlagKey[] {
  const on = STATE_FLAGS.filter((flag) => state[flag]);
  return state.hold === "NONE" ? on : [...on, "hold"];
}

/** Rows in the type's order; unknown transition targets fall back to the id. */
export function toStateRows({ states }: ToStateRowsInput): StateRow[] {
  return states.map((state, index) => ({
    state,
    index,
    targets: state.transitionsTo.map((id) => states.find((s) => s.id === id)?.name ?? id),
    flags: flagsOf({ state }),
  }));
}

/** A state row of the one table of every item type: the type's name and its ordered states. */
export type TypedStateRow = StateRow & { typeName: string; siblings: readonly ItemStateDto[] };

export type ToTypedStateRowsInput = {
  entries: readonly { type: { name: string }; states: readonly ItemStateDto[] }[];
};

/** Rows of every type, type by type in each type's order; `siblings` feed move and archive. */
export function toTypedStateRows({ entries }: ToTypedStateRowsInput): TypedStateRow[] {
  return entries.flatMap(({ type, states }) =>
    toStateRows({ states }).map((row) => ({ ...row, typeName: type.name, siblings: states })),
  );
}
