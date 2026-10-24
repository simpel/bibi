import type { AppErrorIssue } from "../../errors/app-error";
import type { StatusEvent, TicketStatusFlags } from "../ticket-status/schema";

type Status = Pick<
  TicketStatusFlags,
  "closes" | "requiresReason" | "requiresAssignee" | "requiresAcceptedQuote"
> & {
  name: string;
  event?: StatusEvent | null;
};

export type StatusBlockersInput = {
  from: Status;
  to: Status;
  /** Whether the organization allows the move (`TicketStatusTransition`, from → to). */
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
 * Everything that blocks a status move (ADR 0043): a closing start, a move the organization does
 * not allow, a target that only a quote event enters, and the target's `requiresReason`,
 * `requiresAssignee` and `requiresAcceptedQuote` flags (statuses guard facts, ADR 0054). Empty = allowed.
 */
export function statusBlockers({
  from,
  to,
  allowed,
  assigneeId,
  reason,
  viaEvent,
  acceptedQuote,
}: StatusBlockersInput): AppErrorIssue[] {
  const blockers: AppErrorIssue[] = [];
  if (from.closes) {
    blockers.push({ path: "statusId", message: `"${from.name}" is closing: no move leaves it` });
  } else if (!allowed) {
    const message = `The organization does not allow a move from "${from.name}" to "${to.name}"`;
    blockers.push({ path: "statusId", message });
  }
  if (to.event && !viaEvent) {
    const message = `"${to.name}" is entered by the ${to.event} quote event, not by hand`;
    blockers.push({ path: "statusId", message });
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
