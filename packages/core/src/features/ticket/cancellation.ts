import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { releaseLinesOfTicket } from "../line/release-for-ticket";
import type { TicketDto } from "./schema";

export type CancellationInput = {
  context: OperationContext;
  /** The ticket as it was before the cancellation. */
  ticket: TicketDto;
  reason: string | null;
};

/**
 * Applies the organization's cancellation terms to a ticket that enters a closing status (ADR
 * 0022, 0043). Cancellation
 * terms are not built yet (domain model: CancellationTerms); when they are, their hook goes in
 * `CANCELLATION_HOOKS` and runs inside the same transaction as the status change. An error rolls
 * the whole change back.
 */
export type CancellationHook = (input: CancellationInput) => Promise<Result<true>>;

export const CANCELLATION_HOOKS: CancellationHook[] = [];

/**
 * Everything entering a closing status does beyond the status change: every line moves to its
 * released state. The holds go by trigger (ADR 0053).
 */
export async function applyClosing({
  context,
  ticket,
  reason,
}: CancellationInput): Promise<Result<true>> {
  const program = await releaseLinesOfTicket({ context, ticketId: ticket.id });
  if (!program.ok) return program;
  for (const hook of CANCELLATION_HOOKS) {
    const result = await hook({ context, ticket, reason });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
