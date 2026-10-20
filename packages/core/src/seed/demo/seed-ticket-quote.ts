import { err, ok, type Result } from "../../errors/result";
import { createLine, updateLine } from "../../features/line/write-operations";
import { acceptQuote } from "../../features/quote/lifecycle-operations";
import { sendQuote } from "../../features/quote/send-operation";
import { createQuote } from "../../features/quote/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { chosenLineIds } from "./seed-alternatives";
import { missing } from "./seed-fields";
import type { DemoTicket } from "./ticket-types";

type QuoteInput = { context: ExecuteContext; ticket: DemoTicket; ticketId: string; now?: Date };

/** 30 days after the run: the quote's last day to accept. */
const validUntilOf = ({ now }: { now: Date }) => new Date(now.getTime() + 30 * 24 * 3_600_000);

/**
 * ADR 0052: what a quote charges is a line. The ticket gets an untimed line of the `ticket.quote`
 * item (counting the headcount) unless one of its lines already has that item.
 */
async function ensureQuoteLine({ context, ticket, ticketId }: QuoteInput): Promise<Result<true>> {
  const item = ticket.quote
    ? await context.db.item.findFirst({ where: { name: ticket.quote } })
    : null;
  if (!item) return missing({ what: `quote item of ticket ${ticket.ref}` });
  if ((await context.db.line.count({ where: { ticketId, itemId: item.id } })) > 0) {
    return ok({ value: true });
  }
  const type = await context.db.entityType.findFirst({ where: { base: "LINE" } });
  if (!type) return missing({ what: "a line type (base LINE)" });
  const input = { ticketId, entityTypeId: type.id, itemId: item.id, name: item.name };
  const created = await execute({ operation: createLine, input, context });
  return created.ok ? ok({ value: true }) : created;
}

/** Adds the quote's line if needed, creates the quote and sends it; returns the quote id. */
export async function createSentQuote({
  now = new Date(),
  ...rest
}: QuoteInput): Promise<Result<string>> {
  const { context, ticketId } = rest;
  const line = await ensureQuoteLine(rest);
  if (!line.ok) return line;
  const input = { ticketId, validUntil: validUntilOf({ now }) };
  const quote = await execute({ operation: createQuote, input, context });
  if (!quote.ok) return quote;
  const id = quote.value.id;
  const sent = await execute({ operation: sendQuote, input: { id }, context });
  return sent.ok ? ok({ value: id }) : err({ error: sent.error });
}

/** `ticket.changeAfterQuote`: a line edited after the quote, which the accepted quote shows. */
async function changeAfterQuote({ context, ticket, ticketId }: QuoteInput): Promise<Result<true>> {
  const change = ticket.changeAfterQuote;
  if (!change) return ok({ value: true });
  const line = await context.db.line.findFirst({ where: { ticketId, name: change.line } });
  if (!line) return missing({ what: `line ${change.line} of ticket ${ticket.ref}` });
  const input = { id: line.id, quantity: change.quantity };
  const updated = await execute({ operation: updateLine, input, context });
  return updated.ok ? ok({ value: true }) : updated;
}

export type SeedTicketQuoteInput = QuoteInput & {
  /** The quote event of the phase the ticket belongs in. */
  event: "QUOTE_SENT" | "QUOTE_ACCEPTED";
};

/**
 * Brings the ticket into its phase through its quote (ADR 0043, 0052): the ticket's lines are
 * quoted and sent, and for the accepted event also accepted, with the customer's pick of each
 * alternative group that has `chosen` (ADR 0052). The phases follow from the
 * organization's events, never from `ticket.changePhase`.
 */
export async function seedTicketQuote({
  event,
  ...rest
}: SeedTicketQuoteInput): Promise<Result<true>> {
  const sent = await createSentQuote(rest);
  if (!sent.ok) return sent;
  if (event === "QUOTE_SENT") return changeAfterQuote(rest);
  const { context, ticketId, ticket } = rest;
  const alternatives = ticket.alternatives ?? [];
  const chosen = await chosenLineIds({ context, ticketId, alternatives });
  if (!chosen.ok) return chosen;
  const input = { id: sent.value, chosenLineIds: chosen.value };
  const accepted = await execute({ operation: acceptQuote, input, context: rest.context });
  return accepted.ok ? changeAfterQuote(rest) : accepted;
}
