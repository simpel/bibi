import type { AppErrorIssue } from "../../errors/app-error";
import type { TransitionGate } from "../order-status/gate-schema";
import type { OrderStatusFlags, StatusEvent } from "../order-status/schema";

type Status = Pick<OrderStatusFlags, "closes"> & {
  name: string;
  event?: StatusEvent | null;
};

export type StatusBlockersInput = {
  from: Status;
  to: Status;
  /** Whether the organization allows the move (`OrderStatusTransition`, from → to). */
  allowed: boolean;
  /** The gates on that transition (ADR 0067 §5); none when it is not allowed. */
  gates: readonly TransitionGate[];
  /** User id of the order's main assignee (assignment.list), null when nobody is assigned. */
  assigneeId: string | null;
  reason?: string | undefined;
  /** True only for the move a quote event makes (ADR 0043); everything else is by hand. */
  viaEvent?: boolean | undefined;
  /** Whether the order has an accepted quote (needed by the `ACCEPTED_QUOTE` gate, ADR 0054). */
  acceptedQuote?: boolean | undefined;
};

/**
 * Everything that blocks a status move (ADR 0043, 0067): a closing start, a move the organization
 * does not allow, a target that only a quote event enters, and every gate on the transition that
 * its fact does not meet (gates guard facts, ADR 0054). Empty = allowed.
 */
export function statusBlockers({
  from,
  to,
  allowed,
  gates,
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
  const move = `The move from "${from.name}" to "${to.name}"`;
  if (gates.includes("REASON") && !reason) {
    blockers.push({ path: "reason", message: `${move} requires a reason` });
  }
  if (gates.includes("ASSIGNEE") && !assigneeId) {
    const message = `${move} requires a main assignee (assignment.assign)`;
    blockers.push({ path: "assigneeId", message });
  }
  if (gates.includes("ACCEPTED_QUOTE") && !acceptedQuote) {
    const message = `${move} requires an accepted quote (quote.accept)`;
    blockers.push({ path: "quote", message });
  }
  return blockers;
}
