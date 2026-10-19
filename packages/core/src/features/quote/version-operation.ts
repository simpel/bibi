import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { loadOpenTicket, nextVersion } from "./quote-rules";
import { QuoteIdInputSchema, QuoteSchema } from "./schema";
import { loadQuote } from "./to-quote-dto";

export const reviseQuote = defineOperation({
  name: "quote.revise",
  kind: "command",
  description:
    "Make a new version of the ticket's latest quote (ADR 0022, 0052): a DRAFT with the next " +
    "version number that copies the validity and terms. Like every DRAFT it shows the ticket's " +
    "priced lines live, marked ADDED, CHANGED or UNCHANGED against the version it was made " +
    "from (paired by line), and lists the lines it removed. Refused (CONFLICT) for an older version, a DRAFT (edit it instead), an " +
    "ACCEPTED quote or a closed ticket.",
  input: QuoteIdInputSchema,
  output: QuoteSchema,
  permission: "quote:write",
  handler: async ({ input: { id }, context }) => {
    const source = await loadQuote({ context, id });
    if (!source) return notFound({ entity: "Quote" });
    if (source.quoteStatus === "DRAFT" || source.quoteStatus === "ACCEPTED") {
      return conflict({ message: `A ${source.quoteStatus} quote cannot get a new version` });
    }
    const { ticketId } = source;
    const ticket = await loadOpenTicket({ context, ticketId });
    if (!ticket.ok) return ticket;
    const version = await nextVersion({ context, ticketId });
    if (version !== source.version + 1) {
      return conflict({ message: "Only the latest version of a quote can get a new version" });
    }
    const { validUntil, terms } = source;
    const row = await context.db.quote.create({
      data: {
        ...{ ticketId, version, previousId: id, validUntil, terms },
        organizationId: context.organizationId,
      },
    });
    const quote = await loadQuote({ context, id: row.id });
    if (!quote) return notFound({ entity: "Quote" });
    context.recordChange({ entityId: row.id, after: quote });
    return ok({ value: quote });
  },
});
