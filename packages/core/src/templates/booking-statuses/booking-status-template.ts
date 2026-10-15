import type { BookingPhase } from "../../features/booking-status/schema";

export type BookingStatusTemplateStatus = { name: string; color: string; phase: BookingPhase };

/**
 * Booking statuses an organization can import and then edit freely (ADR 0022). Domain words live
 * only in this data. `transitions` name the statuses: `[from, to]`.
 */
export type BookingStatusTemplate = {
  key: string;
  name: string;
  statuses: readonly BookingStatusTemplateStatus[];
  transitions: readonly (readonly [string, string])[];
};

const TERMINAL: readonly BookingPhase[] = ["COMPLETED", "CANCELLED"];

export type ForwardTransitionsInput = { statuses: readonly BookingStatusTemplateStatus[] };

/**
 * Every transition from a status to each status after it (A→B, A→C, B→C), except out of the
 * terminal phases: a completed or cancelled booking does not move on.
 */
export function forwardTransitions({ statuses }: ForwardTransitionsInput): [string, string][] {
  return statuses.flatMap((from, index) =>
    TERMINAL.includes(from.phase)
      ? []
      : statuses.slice(index + 1).map((to): [string, string] => [from.name, to.name]),
  );
}
