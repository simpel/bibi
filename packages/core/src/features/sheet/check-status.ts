import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

export type CheckStatusInput = { context: Pick<OperationContext, "db">; ticketId: string };

/**
 * Sheets go out only while the ticket is open (ADR 0043): a ticket in a closing status is over,
 * its lines are released and nothing is sent for it any more.
 */
export async function checkStatus({ context, ticketId }: CheckStatusInput): Promise<Result<true>> {
  const ticket = await context.db.ticket.findFirst({
    where: { id: ticketId },
    select: { ticketStatus: { select: { closes: true, name: true } } },
  });
  if (ticket && !ticket.ticketStatus.closes) return ok({ value: true });
  const name = ticket?.ticketStatus.name ?? "unknown";
  return conflict({ message: `Sheets cannot be sent for a closed ticket (status "${name}")` });
}
