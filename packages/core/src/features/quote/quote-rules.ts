import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import type { TicketDto } from "../ticket/schema";
import { loadTicket } from "../ticket/to-ticket-dto";
import type { QuoteDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type LoadOpenTicketInput = Db & { ticketId: string };

/** The quote's ticket; a ticket in a closing status gets no new quotes or versions (`CONFLICT`). */
export async function loadOpenTicket({
  context,
  ticketId,
}: LoadOpenTicketInput): Promise<Result<TicketDto>> {
  const ticket = await loadTicket({ context, id: ticketId });
  if (!ticket) return notFound({ entity: "Ticket" });
  const ticketStatus = await context.db.ticketStatus.findFirst({
    where: { id: ticket.statusId, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { name: true, closes: true },
  });
  if (ticketStatus?.closes) {
    return conflict({ message: `The ticket is in "${ticketStatus.name}" and takes no quotes` });
  }
  return ok({ value: ticket });
}

/** Only a DRAFT can be edited; a sent quote is changed by making a new version. */
export function checkDraft({ quote }: { quote: QuoteDto }): Result<true> {
  if (quote.quoteStatus === "DRAFT") return ok({ value: true });
  return conflict({
    message: `A ${quote.quoteStatus} quote cannot be changed; make a new version with quote.revise`,
  });
}

/** The next version number of the ticket's quote (1 when it has none). */
export async function nextVersion({ context, ticketId }: LoadOpenTicketInput): Promise<number> {
  const latest = await context.db.quote.findFirst({
    where: { ticketId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return (latest?.version ?? 0) + 1;
}
