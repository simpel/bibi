import type { TransitionGate } from "../../features/ticket-status/gate-schema";
import type { StatusEvent, TicketStatusFlags } from "../../features/ticket-status/schema";

export type TicketStatusTemplateStatus = {
  name: string;
  color: string;
  event?: StatusEvent | null;
  /** The gates on every template transition into this status (ADR 0067 §5), e.g. a reason for Lost. */
  gatesIn?: readonly TransitionGate[];
} & Partial<TicketStatusFlags>;

/**
 * Ticket statuses an organization can import and then edit freely (ADR 0043). Domain words live
 * only in this data. `transitions` name the statuses: `[from, to]`.
 */
export type TicketStatusTemplate = {
  key: string;
  name: string;
  statuses: readonly TicketStatusTemplateStatus[];
  transitions: readonly (readonly [string, string])[];
};

export type ForwardTransitionsInput = { statuses: readonly TicketStatusTemplateStatus[] };

/**
 * The default transitions (ADR 0043): every move forward plus a move to any closing status, and
 * nothing out of a closing status.
 */
export function forwardTransitions({ statuses }: ForwardTransitionsInput): [string, string][] {
  return statuses.flatMap((from, index) =>
    from.closes
      ? []
      : statuses
          .filter((to, toIndex) => to !== from && (toIndex > index || to.closes))
          .map((to): [string, string] => [from.name, to.name]),
  );
}
