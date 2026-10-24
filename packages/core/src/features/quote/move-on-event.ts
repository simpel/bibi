import { ok, type Result } from "../../errors/result";
import { authorize } from "../../operations/authorize";
import type { OperationContext } from "../../operations/types";
import { changeTicketStatus } from "../ticket/change-status-operation";
import { moveTicket } from "../ticket/move-ticket";
import { loadTicket } from "../ticket/to-ticket-dto";
import type { StatusEvent } from "../ticket-status/schema";

export type MoveOnEventInput = {
  context: OperationContext;
  ticketId: string;
  event: StatusEvent;
};

/**
 * Moves the ticket into the organization's status for a quote event (ADR 0043), as the acting
 * user: `ticket.changeStatus`'s permission and every move check apply. The status stays when the
 * organization has no status for the event, the ticket is already there, or the organization does
 * not allow the move from its current status. Any other blocker (a required reason or assignee, a
 * line collision) fails the move, and so the quote command, without changing anything.
 */
export async function moveOnQuoteEvent({
  context,
  ticketId,
  event,
}: MoveOnEventInput): Promise<Result<true>> {
  const to = await context.db.ticketStatus.findFirst({ where: { event } });
  const before = await loadTicket({ context, id: ticketId });
  if (!to || !before || to.id === before.statusId) return ok({ value: true });
  const transition = { fromStatusId: before.statusId, toStatusId: to.id };
  if ((await context.db.ticketStatusTransition.count({ where: transition })) === 0) {
    return ok({ value: true });
  }
  const allowed = authorize({ operation: changeTicketStatus, context });
  if (!allowed.ok) return allowed;
  const moved = await moveTicket({ context, before, to, trigger: "QUOTE_EVENT" });
  return moved.ok ? ok({ value: true }) : moved;
}
