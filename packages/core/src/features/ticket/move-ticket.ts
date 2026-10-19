import type { TicketPhase } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { mainAssigneeId } from "../assignment/load-assignment";
import { applyTerminal } from "./cancellation";
import { phaseBlockers } from "./phase-rules";
import { applyLineMoves, type LinePlan, planLineMoves } from "./plan-line-moves";
import type { TicketDto } from "./schema";
import { toTicketDto } from "./to-ticket-dto";

export type MoveTicketInput = {
  context: OperationContext;
  /** The ticket as it is before the move. */
  before: TicketDto;
  to: TicketPhase;
  reason?: string | undefined;
  /** True only for the move a quote event makes: other moves cannot enter an event phase. */
  viaEvent?: boolean | undefined;
};

/** The ticket's current phase, archived or not (a ticket keeps its phase when it is archived). */
const loadFrom = ({ context, id }: { context: OperationContext; id: string }) =>
  context.db.ticketPhase.findFirstOrThrow({
    where: { id, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });

/**
 * The one place a ticket's phase changes (ADR 0043, 0044). The move is atomic: the transition,
 * the target's flags and the line moves the phase grid implies are checked first and every
 * blocker is listed in one `CONFLICT`; then the lines move (entering a terminal phase releases
 * every line instead) and the phase changes. `holdsUntil` is left as it is. Audited. Shared by `ticket.changePhase` and the ticket
 * moves of `ticketPhase.archive`.
 */
export async function moveTicket({
  context,
  before,
  to,
  reason,
  viaEvent,
}: MoveTicketInput): Promise<Result<TicketDto>> {
  if (to.id === before.phaseId) {
    return conflict({ message: `The ticket is already in "${to.name}"` });
  }
  const from = await loadFrom({ context, id: before.phaseId });
  const transition = { fromPhaseId: from.id, toPhaseId: to.id };
  const allowed = (await context.db.ticketPhaseTransition.count({ where: transition })) > 0;
  const subject = { subjectType: "TICKET", subjectId: before.id } as const;
  const assigneeId = await mainAssigneeId({ context, ...subject });
  // Terminal phases ignore the grid and overrides: they release every line (ADR 0044).
  const lines: LinePlan = to.terminal
    ? { moves: [], blockers: [] }
    : await planLineMoves({ context, ticketId: before.id, phaseId: to.id });
  const blockers = [
    ...phaseBlockers({ from, to, allowed, assigneeId, reason, viaEvent }),
    ...lines.blockers,
  ];
  if (blockers.length > 0) {
    const message = `Ticket #${before.reference} cannot move to "${to.name}"`;
    return conflict({ message, issues: blockers });
  }
  const applied = to.terminal
    ? await applyTerminal({ context, ticket: before, reason: reason ?? null })
    : await applyLineMoves({ context, moves: lines.moves });
  if (!applied.ok) return applied;
  const row = await context.db.ticket.update({
    where: { id: before.id },
    data: { phaseId: to.id, phaseChangedAt: new Date(), phaseReason: reason ?? null },
  });
  const ticket = toTicketDto({ row });
  context.recordChange({ entityType: "ticket", entityId: before.id, before, after: ticket });
  return ok({ value: ticket });
}
