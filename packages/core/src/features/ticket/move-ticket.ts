import type { TicketPhase } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { mainAssigneeId } from "../assignment/load-assignment";
import { applyTerminal } from "./cancellation";
import { phaseBlockers } from "./phase-rules";
import type { TicketDto } from "./schema";
import { toTicketDto } from "./to-ticket-dto";

export type MoveTicketInput = {
  context: OperationContext;
  /** The ticket as it is before the move. */
  before: TicketDto;
  to: TicketPhase;
  reason?: string | undefined;
};

/** The ticket's current phase, archived or not (a ticket keeps its phase when it is archived). */
const loadFrom = ({ context, id }: { context: OperationContext; id: string }) =>
  context.db.ticketPhase.findFirstOrThrow({
    where: { id, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });

/**
 * The one place a ticket's phase changes (ADR 0043). The move is atomic: the transition and the
 * target's flags are checked first and every blocker is listed in one `CONFLICT`; entering a
 * terminal phase releases every line. Audited. Shared by `ticket.changePhase` and the ticket
 * moves of `ticketPhase.archive`.
 */
export async function moveTicket({
  context,
  before,
  to,
  reason,
}: MoveTicketInput): Promise<Result<TicketDto>> {
  if (to.id === before.phaseId) {
    return conflict({ message: `The ticket is already in "${to.name}"` });
  }
  const from = await loadFrom({ context, id: before.phaseId });
  const transition = { fromPhaseId: from.id, toPhaseId: to.id };
  const allowed = (await context.db.ticketPhaseTransition.count({ where: transition })) > 0;
  const subject = { subjectType: "TICKET", subjectId: before.id } as const;
  const assigneeId = await mainAssigneeId({ context, ...subject });
  const blockers = phaseBlockers({ from, to, allowed, assigneeId, reason });
  if (blockers.length > 0) {
    const message = `Ticket #${before.reference} cannot move to "${to.name}"`;
    return conflict({ message, issues: blockers });
  }
  if (to.terminal) {
    const released = await applyTerminal({ context, ticket: before, reason: reason ?? null });
    if (!released.ok) return released;
  }
  const row = await context.db.ticket.update({
    where: { id: before.id },
    data: { phaseId: to.id, phaseChangedAt: new Date(), phaseReason: reason ?? null },
  });
  const ticket = toTicketDto({ row });
  context.recordChange({ entityType: "ticket", entityId: before.id, before, after: ticket });
  return ok({ value: ticket });
}
