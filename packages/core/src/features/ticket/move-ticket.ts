import type { PhaseChangeTrigger, TicketPhase } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { mainAssigneeId } from "../assignment/load-assignment";
import { applyTerminal } from "./cancellation";
import { recordPhaseChange } from "./phase-history";
import { phaseBlockers } from "./phase-rules";
import { applyLineMoves, type LinePlan, planLineMoves } from "./plan-line-moves";
import type { TicketDto } from "./schema";
import { TICKET_INCLUDE, toTicketDto } from "./to-ticket-dto";

export type MoveTicketInput = {
  context: OperationContext;
  /** The ticket as it is before the move. */
  before: TicketDto;
  to: TicketPhase;
  reason?: string | undefined;
  /**
   * What makes the move, kept in the phase history (ADR 0054). Only `QUOTE_EVENT` may enter an
   * event phase.
   */
  trigger: PhaseChangeTrigger;
};

/** The ticket's current phase, archived or not (a ticket keeps its phase when it is archived). */
const loadFrom = ({ context, id }: { context: OperationContext; id: string }) =>
  context.db.ticketPhase.findFirstOrThrow({
    where: { id, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });

type FactsInput = { context: OperationContext; ticketId: string; to: TicketPhase };

/** Whether the ticket has an accepted quote; only looked up when the target requires one. */
async function hasAcceptedQuote({ context, ticketId, to }: FactsInput) {
  if (!to.requiresAcceptedQuote) return false;
  return (await context.db.quote.count({ where: { ticketId, quoteStatus: "ACCEPTED" } })) > 0;
}

type CheckMoveInput = Omit<MoveTicketInput, "to"> & { from: TicketPhase; to: TicketPhase };

/**
 * Everything checked before a move: the transition, the target's flags and facts, and the line
 * moves the phase grid implies (a terminal target ignores the grid: it releases every line).
 */
async function checkMove({ context, before, from, to, reason, trigger }: CheckMoveInput) {
  const transition = { fromPhaseId: from.id, toPhaseId: to.id };
  const allowed = (await context.db.ticketPhaseTransition.count({ where: transition })) > 0;
  const subject = { subjectType: "TICKET", subjectId: before.id } as const;
  const assigneeId = await mainAssigneeId({ context, ...subject });
  const lines: LinePlan = to.terminal
    ? { moves: [], blockers: [] }
    : await planLineMoves({ context, ticketId: before.id, phaseId: to.id });
  const acceptedQuote = await hasAcceptedQuote({ context, ticketId: before.id, to });
  const viaEvent = trigger === "QUOTE_EVENT";
  const blockers = [
    ...phaseBlockers({ from, to, allowed, assigneeId, reason, viaEvent, acceptedQuote }),
    ...lines.blockers,
  ];
  return { lines, blockers };
}

/**
 * The one place a ticket's phase changes (ADR 0043, 0044, 0054). The move is atomic: the
 * transition, the target's flags and the line moves the phase grid implies are checked first and
 * every blocker is listed in one `CONFLICT`; then the lines move (entering a terminal phase
 * releases every line instead) and one `TicketPhaseChange` row sets the phase by trigger.
 * `holdsUntil` is left as it is. Audited. Shared by `ticket.changePhase`, quote events and the
 * ticket moves of `ticketPhase.archive`.
 */
export async function moveTicket({
  context,
  before,
  to,
  reason,
  trigger,
}: MoveTicketInput): Promise<Result<TicketDto>> {
  if (to.id === before.phaseId) {
    return conflict({ message: `The ticket is already in "${to.name}"` });
  }
  const from = await loadFrom({ context, id: before.phaseId });
  const { lines, blockers } = await checkMove({ context, before, from, to, reason, trigger });
  if (blockers.length > 0) {
    const message = `Ticket #${before.reference} cannot move to "${to.name}"`;
    return conflict({ message, issues: blockers });
  }
  const applied = to.terminal
    ? await applyTerminal({ context, ticket: before, reason: reason ?? null })
    : await applyLineMoves({ context, moves: lines.moves });
  if (!applied.ok) return applied;
  const change = { fromPhaseId: from.id, toPhaseId: to.id, reason, trigger };
  await recordPhaseChange({ context, ticketId: before.id, ...change });
  const row = await context.db.ticket.findFirstOrThrow({
    where: { id: before.id },
    include: TICKET_INCLUDE,
  });
  const ticket = toTicketDto({ row });
  context.recordChange({ entityType: "ticket", entityId: before.id, before, after: ticket });
  return ok({ value: ticket });
}
