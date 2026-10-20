import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import { checkLinesReadable } from "./check-lines-readable";
import { checkPricedLines } from "./check-priced-lines";
import { type DerivedLine, deriveTicketLines } from "./derive-lines";
import { freezeLines } from "./freeze-lines";
import { moveOnQuoteEvent } from "./move-on-event";
import { moveQuote } from "./move-quote";
import { loadOpenTicket } from "./quote-rules";
import { type QuoteDto, QuoteIdInputSchema, QuoteSchema } from "./schema";
import { loadQuote } from "./to-quote-dto";
import { checkQuoteTransition } from "./transitions";

type Context = Pick<OperationContext, "db" | "permissions" | "recordChange">;

type SendableInput = { quote: QuoteDto; lines: readonly DerivedLine[] };

/** Sent with at least one priced line, each with a quantity and VAT, and a future validity. */
function checkSendable({ quote, lines }: SendableInput): Result<true> {
  const priced = checkPricedLines({ lines, what: "A quote" });
  if (!priced.ok) return priced;
  if (!quote.validUntil || quote.validUntil <= new Date()) {
    const message = "A quote needs a validity date in the future to be sent";
    return invalid({ message, issues: [{ path: "validUntil", message }] });
  }
  return ok({ value: true });
}

type SupersedeInput = { context: Context; quote: QuoteDto };

/** Expires the older SENT versions of the quote. */
async function supersede({ context, quote }: SupersedeInput): Promise<Result<true>> {
  const older = await context.db.quote.findMany({
    where: { ticketId: quote.ticketId, quoteStatus: "SENT", id: { not: quote.id } },
    select: { id: true },
  });
  for (const { id } of older) {
    const before = await loadQuote({ context, id });
    if (!before) continue;
    const expired = await moveQuote({ context, before, to: "EXPIRED" });
    if (!expired.ok) return expired;
  }
  return ok({ value: true });
}

export const sendQuote = defineOperation({
  name: "quote.send",
  kind: "command",
  description:
    "Mark a DRAFT quote as SENT to the customer (ADR 0022, 0052). Freezes the ticket's priced " +
    "lines as the quote's snapshot: one order line per line with its effective price, VAT, " +
    "tags and totals; later line changes never touch it. It needs at least one priced line, " +
    "each with a quantity and VAT, and a future `validUntil`, and the ticket must not be in a " +
    "terminal phase. Older SENT versions expire. The ticket's phase does not change. Any other " +
    "starting status is a CONFLICT. Needs program:read and item:read (the lines are copied).",
  input: QuoteIdInputSchema,
  output: QuoteSchema,
  permission: "quote:write",
  handler: async ({ input: { id }, context }) => {
    const readable = checkLinesReadable({ context, path: "id" });
    if (!readable.ok) return readable;
    const before = await loadQuote({ context, id });
    if (!before) return notFound({ entity: "Quote" });
    const allowed = checkQuoteTransition({ from: before.quoteStatus, to: "SENT" });
    if (!allowed.ok) return allowed;
    const { ticketId } = before;
    const lines = (await deriveTicketLines({ context, ticketIds: [ticketId] })).get(ticketId) ?? [];
    const sendable = checkSendable({ quote: before, lines });
    if (!sendable.ok) return sendable;
    const ticket = await loadOpenTicket({ context, ticketId });
    if (!ticket.ok) return ticket;
    const superseded = await supersede({ context, quote: before });
    if (!superseded.ok) return superseded;
    const frozen = await freezeLines({ context, quoteId: id, lines: lines.map((d) => d.line) });
    if (!frozen.ok) return frozen;
    const sent = await moveQuote({ context, before, to: "SENT" });
    if (!sent.ok) return sent;
    const moved = await moveOnQuoteEvent({ context, ticketId, event: "QUOTE_SENT" });
    return moved.ok ? sent : moved;
  },
});
