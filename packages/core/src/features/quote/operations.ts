import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { acceptQuote, declineQuote, expireQuote } from "./lifecycle-operations";
import {
  QuoteIdInputSchema,
  QuoteListInputSchema,
  QuoteListOutputSchema,
  QuoteSchema,
} from "./schema";
import { sendQuote } from "./send-operation";
import { loadQuote, QUOTE_INCLUDE, toQuoteDtos } from "./to-quote-dto";
import { reviseQuote } from "./version-operation";
import { createQuote, updateQuote } from "./write-operations";

export const listQuotes = defineOperation({
  name: "quote.list",
  kind: "query",
  description:
    "List the organization's quotes, newest first, with their lines. Filter by ticket (its " +
    "versions) or status (DRAFT, SENT, ACCEPTED, DECLINED, EXPIRED).",
  input: QuoteListInputSchema,
  output: QuoteListOutputSchema,
  permission: "quote:read",
  handler: async ({ input, context }) => {
    const { ticketId, quoteStatus } = input;
    const rows = await context.db.quote.findMany({
      where: { ...(ticketId ? { ticketId } : {}), ...(quoteStatus ? { quoteStatus } : {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: QUOTE_INCLUDE,
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = await toQuoteDtos({ context, rows: page.items });
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getQuote = defineOperation({
  name: "quote.get",
  kind: "query",
  description:
    "Get one quote version by id: ticket, version, status, validity, terms, totals and " +
    "its order lines (snapshots) marked against the previous version, with the lines it " +
    "removed. The quote has no owner of its own: it uses the ticket's.",
  input: QuoteIdInputSchema,
  output: QuoteSchema,
  permission: "quote:read",
  handler: async ({ input, context }) => {
    const quote = await loadQuote({ context, id: input.id });
    return quote ? ok({ value: quote }) : notFound({ entity: "Quote" });
  },
});

export const quoteOperations = [
  listQuotes,
  getQuote,
  createQuote,
  updateQuote,
  reviseQuote,
  sendQuote,
  acceptQuote,
  declineQuote,
  expireQuote,
];
