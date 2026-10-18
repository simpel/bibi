import {
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
} from "@okazi/core";
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
    "An order line on a quote: a snapshot of the item's name, price, VAT and contained tags, " +
    "marked against the previous version.",
});

const RemovedLineRef = objectFromSchema<OrderLineDto>({
  name: "RemovedQuoteLine",
  schema: OrderLineSchema,
  description: "A line of the previous version that the quote no longer has.",
});

export const QuoteRef = objectFromSchema<QuoteDto>({
  name: "Quote",
  schema: QuoteSchema,
  omit: ["organizationId", "lines", "removedLines"],
  description:
    "Quote – a versioned proposal to an ticket with order lines, terms and totals; fixed status " +
    "DRAFT → SENT → ACCEPTED, DECLINED or EXPIRED. It uses the ticket's owner, none of its own.",
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
}));

fieldFromOperation({ operation: listQuotes, type: QuotePageRef, name: "quotes" });
fieldFromOperation({ operation: getQuote, type: QuoteRef, name: "quote" });
for (const operation of [
  createQuote,
  updateQuote,
  reviseQuote,
  sendQuote,
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
