import { err, ok, type Result } from "../../errors/result";
import { acceptQuote } from "../../features/quote/lifecycle-operations";
import { sendQuote } from "../../features/quote/send-operation";
import { createQuote } from "../../features/quote/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { missing } from "./seed-fields";
import type { DemoTicket } from "./ticket-types";

type QuoteInput = { context: ExecuteContext; ticket: DemoTicket; ticketId: string; now?: Date };

/** 30 days after the run: the quote's last day to accept. */
const validUntilOf = ({ now }: { now: Date }) => new Date(now.getTime() + 30 * 24 * 3_600_000);

/** Creates the ticket's quote (one line of `ticket.quote`) and sends it; returns the quote id. */
export async function createSentQuote({
  context,
  ticket,
  ticketId,
  now = new Date(),
}: QuoteInput): Promise<Result<string>> {
  const item = ticket.quote
    ? await context.db.item.findFirst({ where: { name: ticket.quote } })
    : null;
  if (!item) return missing({ what: `quote item of ticket ${ticket.ref}` });
  const lines = [{ itemId: item.id, quantity: ticket.headcount }];
  const input = { ticketId, validUntil: validUntilOf({ now }), lines };
  const quote = await execute({ operation: createQuote, input, context });
  if (!quote.ok) return quote;
  const id = quote.value.id;
  const sent = await execute({ operation: sendQuote, input: { id }, context });
  return sent.ok ? ok({ value: id }) : err({ error: sent.error });
}

export type SeedTicketQuoteInput = QuoteInput & {
  /** The quote event of the phase the ticket belongs in. */
  event: "QUOTE_SENT" | "QUOTE_ACCEPTED";
};

/**
 * Brings the ticket into its phase through its quote (ADR 0043): a quote with one line is created
 * and sent, and for the accepted event also accepted. The phases follow from the organization's
 * events, never from `ticket.changePhase`.
 */
export async function seedTicketQuote({
  event,
  ...rest
}: SeedTicketQuoteInput): Promise<Result<true>> {
  const sent = await createSentQuote(rest);
  if (!sent.ok) return sent;
  if (event === "QUOTE_SENT") return ok({ value: true });
  const input = { id: sent.value };
  const accepted = await execute({ operation: acceptQuote, input, context: rest.context });
  return accepted.ok ? ok({ value: true }) : accepted;
}
