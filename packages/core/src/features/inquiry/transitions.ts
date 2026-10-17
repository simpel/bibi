import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import type { InquiryStatus } from "./schema";

/**
 * The inquiry's fixed state machine (ADR 0022): `NEW → QUALIFIED → QUOTED → WON`, and `LOST`
 * from any open status. `WON` and `LOST` are final. Each move has its own command.
 */
export const INQUIRY_TRANSITIONS: Readonly<Record<InquiryStatus, readonly InquiryStatus[]>> = {
  NEW: ["QUALIFIED", "LOST"],
  QUALIFIED: ["QUOTED", "LOST"],
  QUOTED: ["WON", "LOST"],
  WON: [],
  LOST: [],
};

/** Statuses in which the inquiry must have a main assignee (ADR 0034). */
export const ASSIGNEE_REQUIRED_STATUSES: readonly InquiryStatus[] = ["QUALIFIED", "QUOTED", "WON"];

export type InquiryTransition = { from: InquiryStatus; to: InquiryStatus };

/** Whether the state machine allows the move. */
export const canTransition = ({ from, to }: InquiryTransition): boolean =>
  INQUIRY_TRANSITIONS[from].includes(to);

/** `CONFLICT` unless the state machine allows the move. */
export function checkTransition({ from, to }: InquiryTransition): Result<true> {
  if (canTransition({ from, to })) return ok({ value: true });
  return conflict({ message: `An inquiry cannot move from ${from} to ${to}` });
}
