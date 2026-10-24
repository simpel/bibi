import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import type { AssignmentSlot } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

/** The name of the ticket's status when that status requires a main assignee, else null. */
async function ticketNeedsAssignee({ context, subjectId }: Db & { subjectId: string }) {
  const ticket = await context.db.ticket.findFirst({
    where: { id: subjectId },
    select: { ticketStatus: { select: { requiresAssignee: true, name: true } } },
  });
  return ticket?.ticketStatus.requiresAssignee ? ticket.ticketStatus.name : null;
}

/**
 * The main assignee cannot be removed while the ticket's status requires one (ADR 0034, 0043:
 * `requiresAssignee`). Responsibility assignments are never required.
 */
export async function checkAssigneeKept({
  context,
  subjectType,
  subjectId,
  responsibilityId,
}: Db & AssignmentSlot): Promise<Result<true>> {
  if (responsibilityId || subjectType !== "TICKET") return ok({ value: true });
  const needs = await ticketNeedsAssignee({ context, subjectId });
  if (!needs) return ok({ value: true });
  return conflict({ message: `A ticket in "${needs}" requires an assignee` });
}
