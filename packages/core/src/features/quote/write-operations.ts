import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { checkDraft, loadOpenTicket } from "./quote-rules";
import { QuoteCreateInputSchema, QuoteSchema, QuoteUpdateInputSchema } from "./schema";
import { loadQuote } from "./to-quote-dto";

export const createQuote = defineOperation({
  name: "quote.create",
  kind: "command",
  description:
    "Create the first quote (version 1, status DRAFT) for an open ticket (ADR 0022, 0052). A " +
    "DRAFT stores no lines: it shows the ticket's priced lines live (add or change them with " +
    "line.create and line.update) with derived totals, and quote.send freezes them. The quote " +
    "has no owner of its own; it uses the ticket's. A ticket that already has a quote gets a " +
    "new version with quote.revise instead (CONFLICT).",
  input: QuoteCreateInputSchema,
  output: QuoteSchema,
  permission: "quote:write",
  handler: async ({ input: { ticketId, ...terms }, context }) => {
    const ticket = await loadOpenTicket({ context, ticketId });
    if (!ticket.ok) return ticket;
    if ((await context.db.quote.count({ where: { ticketId } })) > 0) {
      return conflict({ message: "The ticket already has a quote; make a new version instead" });
    }
    const row = await context.db.quote.create({
      data: { ...terms, ticketId, version: 1, organizationId: context.organizationId },
    });
    const quote = await loadQuote({ context, id: row.id });
    if (!quote) return notFound({ entity: "Quote" });
    context.recordChange({ entityId: row.id, after: quote });
    return ok({ value: quote });
  },
});

export const updateQuote = defineOperation({
  name: "quote.update",
  kind: "command",
  description:
    "Change a DRAFT quote's validity or terms. Omitted properties are unchanged. The lines are " +
    "the ticket's own: change them with line.update (ADR 0052). A quote that is not a DRAFT " +
    "cannot be changed (CONFLICT): make a new version with quote.revise. The status changes " +
    "only with quote.send, quote.accept, quote.decline and quote.expire.",
  input: QuoteUpdateInputSchema,
  output: QuoteSchema,
  permission: "quote:write",
  handler: async ({ input: { id, ...terms }, context }) => {
    const before = await loadQuote({ context, id });
    if (!before) return notFound({ entity: "Quote" });
    const draft = checkDraft({ quote: before });
    if (!draft.ok) return draft;
    const ticket = await loadOpenTicket({ context, ticketId: before.ticketId });
    if (!ticket.ok) return ticket;
    await context.db.quote.update({ where: { id }, data: terms });
    const after = await loadQuote({ context, id });
    if (!after) return notFound({ entity: "Quote" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
