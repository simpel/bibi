import type { OperationContext } from "../../operations/types";
import { effectiveFollowerIds } from "../assignment/derive-assignment";
import { listSubjectAssignments } from "../assignment/list-subject";

type Scope = { context: Pick<OperationContext, "db" | "organizationId">; ticketId: string };

/**
 * Everyone who answers for or follows a ticket (ADR 0055): the main assignee and followers, and
 * the assignee and followers of every responsibility on it, stored or by default.
 */
export async function ticketPeople({ context, ticketId }: Scope): Promise<string[]> {
  const slots = await listSubjectAssignments({
    ...{ context, subjectType: "TICKET" as const, subjectId: ticketId },
  });
  return slots.flatMap((assignment) => [
    ...(assignment.assigneeId ? [assignment.assigneeId] : []),
    ...effectiveFollowerIds({ assignment }),
  ]);
}

/** The ticket's reference and title for a notification's snapshot. */
export async function ticketFacts({ context, ticketId }: Scope) {
  const ticket = await context.db.ticket.findFirst({
    where: { id: ticketId },
    select: { reference: true, title: true },
  });
  return ticket ? { ticketReference: ticket.reference, ticketTitle: ticket.title } : null;
}
