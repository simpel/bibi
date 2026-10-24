import type { StatusChangeTrigger, TicketStatus } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { mainAssigneeId } from "../assignment/load-assignment";
import { applyClosing } from "./cancellation";
import { applyLineMoves, type LinePlan, planLineMoves } from "./plan-line-moves";
import type { TicketDto } from "./schema";
import { recordStatusChange } from "./status-history";
import { statusBlockers } from "./status-rules";
import { TICKET_INCLUDE, toTicketDto } from "./to-ticket-dto";

export type MoveTicketInput = {
  context: OperationContext;
  /** The ticket as it is before the move. */
  before: TicketDto;
  to: TicketStatus;
  reason?: string | undefined;
  /**
   * What makes the move, kept in the status history (ADR 0054). Only `QUOTE_EVENT` may enter an
   * event status.
   */
  trigger: StatusChangeTrigger;
};

/** The ticket's current status, archived or not (a ticket keeps its status when it is archived). */
const loadFrom = ({ context, id }: { context: OperationContext; id: string }) =>
  context.db.ticketStatus.findFirstOrThrow({
    where: { id, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });

type FactsInput = { context: OperationContext; ticketId: string; to: TicketStatus };

/** Whether the ticket has an accepted quote; only looked up when the target requires one. */
async function hasAcceptedQuote({ context, ticketId, to }: FactsInput) {
  if (!to.requiresAcceptedQuote) return false;
  return (await context.db.quote.count({ where: { ticketId, quoteStatus: "ACCEPTED" } })) > 0;
}

type CheckMoveInput = Omit<MoveTicketInput, "to"> & { from: TicketStatus; to: TicketStatus };

/**
 * Everything checked before a move: the transition, the target's flags and facts, and the line
 * moves the status grid implies (a closing target ignores the grid: it releases every line).
 */
async function checkMove({ context, before, from, to, reason, trigger }: CheckMoveInput) {
  const transition = { fromStatusId: from.id, toStatusId: to.id };
  const allowed = (await context.db.ticketStatusTransition.count({ where: transition })) > 0;
  const subject = { subjectType: "TICKET", subjectId: before.id } as const;
  const assigneeId = await mainAssigneeId({ context, ...subject });
  const lines: LinePlan = to.closes
    ? { moves: [], blockers: [] }
    : await planLineMoves({ context, ticketId: before.id, statusId: to.id });
  const acceptedQuote = await hasAcceptedQuote({ context, ticketId: before.id, to });
  const viaEvent = trigger === "QUOTE_EVENT";
  const blockers = [
    ...statusBlockers({ from, to, allowed, assigneeId, reason, viaEvent, acceptedQuote }),
    ...lines.blockers,
  ];
  return { lines, blockers };
}

/**
 * The one place a ticket's status changes (ADR 0043, 0044, 0054). The move is atomic: the
 * transition, the target's flags and the line moves the status grid implies are checked first and
 * every blocker is listed in one `CONFLICT`; then the lines move (entering a closing status
 * releases every line instead) and one `TicketStatusChange` row sets the status by trigger.
 * `holdsUntil` is left as it is. Audited. Shared by `ticket.changeStatus`, quote events and the
 * ticket moves of `ticketStatus.archive`.
 */
export async function moveTicket({
  context,
  before,
  to,
  reason,
  trigger,
}: MoveTicketInput): Promise<Result<TicketDto>> {
  if (to.id === before.statusId) {
    return conflict({ message: `The ticket is already in "${to.name}"` });
  }
  const from = await loadFrom({ context, id: before.statusId });
  const { lines, blockers } = await checkMove({ context, before, from, to, reason, trigger });
  if (blockers.length > 0) {
    const message = `Ticket #${before.reference} cannot move to "${to.name}"`;
    return conflict({ message, issues: blockers });
  }
  const applied = to.closes
    ? await applyClosing({ context, ticket: before, reason: reason ?? null })
    : await applyLineMoves({ context, moves: lines.moves });
  if (!applied.ok) return applied;
  const change = { fromStatusId: from.id, toStatusId: to.id, reason, trigger };
  await recordStatusChange({ context, ticketId: before.id, ...change });
  const row = await context.db.ticket.findFirstOrThrow({
    where: { id: before.id },
    include: TICKET_INCLUDE,
  });
  const ticket = toTicketDto({ row });
  context.recordChange({ entityType: "ticket", entityId: before.id, before, after: ticket });
  return ok({ value: ticket });
}
