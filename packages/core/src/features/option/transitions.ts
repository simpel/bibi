import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import type { OptionStatus } from "./schema";

/**
 * The option's fixed state machine (ADR 0022): an `ACTIVE` option is `CONVERTED` (its quote was
 * accepted), `EXPIRED` (its date passed) or `RELEASED` (given up). All three are final.
 */
export const OPTION_TRANSITIONS: Readonly<Record<OptionStatus, readonly OptionStatus[]>> = {
  ACTIVE: ["CONVERTED", "EXPIRED", "RELEASED"],
  CONVERTED: [],
  EXPIRED: [],
  RELEASED: [],
};

export type OptionTransition = { from: OptionStatus; to: OptionStatus };

/** Whether the option's state machine allows the move. */
export const canMoveOption = ({ from, to }: OptionTransition): boolean =>
  OPTION_TRANSITIONS[from].includes(to);

/** `CONFLICT` unless the option's state machine allows the move. */
export function checkOptionTransition({ from, to }: OptionTransition): Result<true> {
  if (canMoveOption({ from, to })) return ok({ value: true });
  return conflict({ message: `An option cannot move from ${from} to ${to}` });
}
