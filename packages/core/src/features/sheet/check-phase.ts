import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

export type CheckPhaseInput = { context: Pick<OperationContext, "db">; ticketId: string };

/**
 * Sheets go out only while the ticket is open (ADR 0043): a ticket in a terminal phase is over,
 * its lines are released and nothing is sent for it any more.
 */
export async function checkPhase({ context, ticketId }: CheckPhaseInput): Promise<Result<true>> {
  const ticket = await context.db.ticket.findFirst({
    where: { id: ticketId },
    select: { phase: { select: { terminal: true, name: true } } },
  });
  if (ticket && !ticket.phase.terminal) return ok({ value: true });
  const name = ticket?.phase.name ?? "unknown";
  return conflict({ message: `Sheets cannot be sent for a closed ticket (phase "${name}")` });
}
