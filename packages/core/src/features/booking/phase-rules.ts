import { ok, type Result } from "../../errors/result";
import { conflict, invalid } from "../../shared/errors";
import type { BookingPhase } from "../booking-status/schema";

/** The phases in which a booking must have a main assignee (ADR 0034: from `CONFIRMED` on). */
export const ASSIGNEE_REQUIRED_PHASES: readonly BookingPhase[] = ["CONFIRMED", "COMPLETED"];

export type PhaseRulesInput = {
  booking: { endsAt: Date };
  /** User id of the booking's main assignee (assignment.list), null when nobody is assigned. */
  assigneeId: string | null;
  /** The phase of the status the booking moves to. */
  phase: BookingPhase;
  /** The status the booking moves to, named in the messages. */
  statusName: string;
  reason?: string | undefined;
  now: Date;
};

/**
 * The fixed rules for entering a phase (ADR 0022, 0034). They apply to every transition, however the
 * organization has configured its statuses and transitions, and cannot be turned off.
 */
export function checkPhaseRules({
  booking,
  assigneeId,
  phase,
  statusName,
  reason,
  now,
}: PhaseRulesInput): Result<true> {
  if (ASSIGNEE_REQUIRED_PHASES.includes(phase) && !assigneeId) {
    return conflict({
      message: `A booking in "${statusName}" requires an assignee (assignment.assign)`,
    });
  }
  if (phase === "COMPLETED" && booking.endsAt > now) {
    return conflict({
      message: `A booking can be moved to "${statusName}" only after it has ended`,
    });
  }
  if (phase === "CANCELLED" && !reason) {
    const message = "Give a reason for the cancellation";
    return invalid({ message, issues: [{ path: "reason", message }] });
  }
  return ok({ value: true });
}
