import {
  acceptQuote,
  createQuote,
  declineQuote,
  expireQuote,
  getQuote,
  listQuotes,
  type OrderLineDto,
  OrderLineSchema,
  type QuoteDto,
  type QuoteLineDto,
  QuoteLineSchema,
  QuoteSchema,
  reviseQuote,
  sendQuote,
  type TicketDto,
  updateQuote,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { TicketRef } from "../ticket/graphql";

const QuoteLineRef = objectFromSchema<QuoteLineDto>({
  name: "QuoteLine",
  schema: QuoteLineSchema,
  description:
    "An order line on a quote: the price of one ticket line (live on a DRAFT, frozen once " +
    "sent), marked against an earlier snapshot by line.",
});

const RemovedLineRef = objectFromSchema<OrderLineDto>({
  name: "RemovedQuoteLine",
  schema: OrderLineSchema,
  description: "A line of the previous version that the quote no longer has.",
});

export const QuoteRef = objectFromSchema<QuoteDto>({
  name: "Quote",
  schema: QuoteSchema,
  omit: ["organizationId", "lines", "removedLines", "ticketChanges", "ticketRemovedLines"],
  description:
    "Quote – a versioned proposal to a ticket with terms and totals; a DRAFT shows the ticket's " +
    "priced lines live and sending freezes them (ADR 0052). Fixed status DRAFT → SENT → " +
    "ACCEPTED, DECLINED or EXPIRED. It uses the ticket's owner, none of its own.",
});
const QuotePageRef = pageType({ name: "QuotePage", item: QuoteRef });

builder.objectFields(QuoteRef, (t) => ({
  lines: t.field({
    type: [QuoteLineRef],
    description: "The order lines in order.",
    resolve: (quote) => quote.lines,
  }),
  removedLines: t.field({
    type: [RemovedLineRef],
    description: QuoteSchema.shape.removedLines.description,
    resolve: (quote) => quote.removedLines,
  }),
  ticketChanges: t.field({
    type: [QuoteLineRef],
    description: QuoteSchema.shape.ticketChanges.description,
    resolve: (quote) => quote.ticketChanges,
  }),
  ticketRemovedLines: t.field({
    type: [RemovedLineRef],
    description: QuoteSchema.shape.ticketRemovedLines.description,
    resolve: (quote) => quote.ticketRemovedLines,
  }),
}));

fieldFromOperation({ operation: listQuotes, type: QuotePageRef, name: "quotes" });
fieldFromOperation({ operation: getQuote, type: QuoteRef, name: "quote" });
for (const operation of [
  createQuote,
  updateQuote,
  reviseQuote,
  sendQuote,
  acceptQuote,
  declineQuote,
  expireQuote,
]) {
  mutationFromOperation({ operation, type: QuoteRef });
}

builder.objectField(TicketRef, "quotes", (t) =>
  t.field({
    type: [QuoteRef],
    description: "Every version of the ticket's quote, newest first.",
    resolve: async (ticket: TicketDto, _args, ctx) => {
      const page = (await runOperation({
        operation: listQuotes,
        input: { ticketId: ticket.id, limit: 100 },
        ctx,
      })) as { items: QuoteDto[] };
      return page.items;
    },
  }),
);

builder.objectField(TicketRef, "differsFromAcceptedQuote", (t) =>
  t.field({
    type: "Boolean",
    nullable: true,
    description:
      "ADR 0052: the ticket's priced lines differ from its accepted quote (derived, never " +
      "stored); null when no quote is accepted. The differences are on the quote's ticketChanges.",
    resolve: async (ticket: TicketDto, _args, ctx) => {
      const page = (await runOperation({
        operation: listQuotes,
        input: { ticketId: ticket.id, quoteStatus: "ACCEPTED", limit: 1 },
        ctx,
      })) as { items: QuoteDto[] };
      return page.items[0]?.differsFromTicket ?? null;
    },
  }),
);
