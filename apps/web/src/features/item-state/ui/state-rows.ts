import type { ItemStateDto } from "@okazi/core/schemas";
import { STATE_FLAGS } from "@okazi/core/schemas";

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
