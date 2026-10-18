import type { AppErrorIssue } from "../../errors/app-error";
import type { TicketPhaseFlags } from "../ticket-phase/schema";

type Phase = Pick<TicketPhaseFlags, "terminal" | "requiresReason" | "requiresAssignee"> & {
  name: string;
};

export type PhaseBlockersInput = {
  from: Phase;
  to: Phase;
  /** Whether the organization allows the move (`TicketPhaseTransition`, from → to). */
  allowed: boolean;
  /** User id of the ticket's main assignee (assignment.list), null when nobody is assigned. */
  assigneeId: string | null;
  reason?: string | undefined;
};

/**
 * Everything that blocks a phase move (ADR 0043): a terminal start, a move the organization does
 * not allow, and the target's `requiresReason` and `requiresAssignee` flags. Empty = allowed.
 */
export function phaseBlockers({
  from,
  to,
  allowed,
  assigneeId,
  reason,
}: PhaseBlockersInput): AppErrorIssue[] {
  const blockers: AppErrorIssue[] = [];
  if (from.terminal) {
    blockers.push({ path: "phaseId", message: `"${from.name}" is terminal: no move leaves it` });
  } else if (!allowed) {
    const message = `The organization does not allow a move from "${from.name}" to "${to.name}"`;
    blockers.push({ path: "phaseId", message });
  }
  if (to.requiresReason && !reason) {
    blockers.push({ path: "reason", message: `"${to.name}" requires a reason` });
  }
  if (to.requiresAssignee && !assigneeId) {
    const message = `"${to.name}" requires a main assignee (assignment.assign)`;
    blockers.push({ path: "assigneeId", message });
  }
  return blockers;
}
