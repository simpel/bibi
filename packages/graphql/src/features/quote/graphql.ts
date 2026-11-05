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
  type OrderDto,
  updateQuote,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { OrderRef } from "../order/graphql";

const QuoteLineRef = objectFromSchema<QuoteLineDto>({
  name: "QuoteLine",
  schema: QuoteLineSchema,
  description:
    "An order line on a quote: the price of one order line (live on a DRAFT, frozen once " +
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
  omit: ["organizationId", "lines", "removedLines", "orderChanges", "orderRemovedLines"],
  description:
    "Quote – a versioned proposal to an order with terms and totals; a DRAFT shows the order's " +
    "priced lines live and sending freezes them (ADR 0052). Fixed status DRAFT → SENT → " +
    "ACCEPTED, DECLINED or EXPIRED. It uses the order's owner, none of its own.",
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
  orderChanges: t.field({
    type: [QuoteLineRef],
    description: QuoteSchema.shape.orderChanges.description,
    resolve: (quote) => quote.orderChanges,
  }),
  orderRemovedLines: t.field({
    type: [RemovedLineRef],
    description: QuoteSchema.shape.orderRemovedLines.description,
    resolve: (quote) => quote.orderRemovedLines,
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

builder.objectField(OrderRef, "quotes", (t) =>
  t.field({
    type: [QuoteRef],
    description: "Every version of the order's quote, newest first.",
    resolve: async (order: OrderDto, _args, ctx) => {
      const page = (await runOperation({
        operation: listQuotes,
        input: { orderId: order.id, limit: 100 },
        ctx,
      })) as { items: QuoteDto[] };
      return page.items;
    },
  }),
);

builder.objectField(OrderRef, "differsFromAcceptedQuote", (t) =>
  t.field({
    type: "Boolean",
    nullable: true,
    description:
      "ADR 0052: the order's priced lines differ from its accepted quote (derived, never " +
      "stored); null when no quote is accepted. The differences are on the quote's orderChanges.",
    resolve: async (order: OrderDto, _args, ctx) => {
      const page = (await runOperation({
        operation: listQuotes,
        input: { orderId: order.id, quoteStatus: "ACCEPTED", limit: 1 },
        ctx,
      })) as { items: QuoteDto[] };
      return page.items[0]?.differsFromOrder ?? null;
    },
  }),
);
