import type { AppErrorIssue } from "../../errors/app-error";
import type { PhaseEvent, TicketPhaseFlags } from "../ticket-phase/schema";

type Phase = Pick<
  TicketPhaseFlags,
  "terminal" | "requiresReason" | "requiresAssignee" | "requiresAcceptedQuote"
> & {
  name: string;
  event?: PhaseEvent | null;
};

export type PhaseBlockersInput = {
  from: Phase;
  to: Phase;
  /** Whether the organization allows the move (`TicketPhaseTransition`, from → to). */
  allowed: boolean;
  /** User id of the ticket's main assignee (assignment.list), null when nobody is assigned. */
  assigneeId: string | null;
  reason?: string | undefined;
  /** True only for the move a quote event makes (ADR 0043); everything else is by hand. */
  viaEvent?: boolean | undefined;
  /** Whether the ticket has an accepted quote (needed by `requiresAcceptedQuote`, ADR 0054). */
  acceptedQuote?: boolean | undefined;
};

/**
 * Everything that blocks a phase move (ADR 0043): a terminal start, a move the organization does
 * not allow, a target that only a quote event enters, and the target's `requiresReason`,
 * `requiresAssignee` and `requiresAcceptedQuote` flags (phases guard facts, ADR 0054). Empty = allowed.
 */
export function phaseBlockers({
  from,
  to,
  allowed,
  assigneeId,
  reason,
  viaEvent,
  acceptedQuote,
}: PhaseBlockersInput): AppErrorIssue[] {
  const blockers: AppErrorIssue[] = [];
  if (from.terminal) {
    blockers.push({ path: "phaseId", message: `"${from.name}" is terminal: no move leaves it` });
  } else if (!allowed) {
    const message = `The organization does not allow a move from "${from.name}" to "${to.name}"`;
    blockers.push({ path: "phaseId", message });
  }
  if (to.event && !viaEvent) {
    const message = `"${to.name}" is entered by the ${to.event} quote event, not by hand`;
    blockers.push({ path: "phaseId", message });
  }
  if (to.requiresReason && !reason) {
    blockers.push({ path: "reason", message: `"${to.name}" requires a reason` });
  }
  if (to.requiresAssignee && !assigneeId) {
    const message = `"${to.name}" requires a main assignee (assignment.assign)`;
    blockers.push({ path: "assigneeId", message });
  }
  if (to.requiresAcceptedQuote && !acceptedQuote) {
    const message = `"${to.name}" requires an accepted quote (quote.accept)`;
    blockers.push({ path: "quote", message });
  }
  return blockers;
}
