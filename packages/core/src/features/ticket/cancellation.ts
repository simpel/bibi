import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { releaseOccupancyBySource } from "../occupancy/release-by-source";
import { releaseProgramItemsOfTicket } from "../program-item/release-for-ticket";
import type { TicketDto } from "./schema";

/** `Occupancy.sourceType` of the rows a ticket holds; `sourceId` is the ticket id. */
export const TICKET_OCCUPANCY_SOURCE = "ticket";

export type CancellationInput = {
  context: OperationContext;
  /** The ticket as it was before the cancellation. */
  ticket: TicketDto;
  reason: string | null;
};

/**
 * Applies the organization's cancellation terms to a ticket that enters a terminal phase (ADR
 * 0022, 0043). Cancellation
 * terms are not built yet (domain model: CancellationTerms); when they are, their hook goes in
 * `CANCELLATION_HOOKS` and runs inside the same transaction as the phase change. An error rolls
 * the whole change back.
 */
export type CancellationHook = (input: CancellationInput) => Promise<Result<true>>;

export const CANCELLATION_HOOKS: CancellationHook[] = [];

export type ReleaseTicketOccupancyInput = { context: OperationContext; ticketId: string };

/** Releases every active occupancy the ticket holds, so the items can be booked again. */
export const releaseTicketOccupancy = ({
  context,
  ticketId,
}: ReleaseTicketOccupancyInput): Promise<Result<true>> =>
  releaseOccupancyBySource({ context, sourceType: TICKET_OCCUPANCY_SOURCE, sourceId: ticketId });

/** Everything entering a terminal phase does beyond the phase change: every line is released. */
export async function applyTerminal({
  context,
  ticket,
  reason,
}: CancellationInput): Promise<Result<true>> {
  const released = await releaseTicketOccupancy({ context, ticketId: ticket.id });
  if (!released.ok) return released;
  const program = await releaseProgramItemsOfTicket({ context, ticketId: ticket.id });
  if (!program.ok) return program;
  for (const hook of CANCELLATION_HOOKS) {
    const result = await hook({ context, ticket, reason });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
