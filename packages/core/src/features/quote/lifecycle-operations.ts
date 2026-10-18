import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { moveQuote } from "./move-quote";
import { QuoteIdInputSchema, QuoteSchema, type QuoteStatus } from "./schema";
import { loadQuote } from "./to-quote-dto";

type CloseInput = { name: string; to: QuoteStatus; description: string };

/** A command that moves a SENT quote to a final status; any other start is `CONFLICT`. */
const closeQuote = ({ name, to, description }: CloseInput) =>
  defineOperation({
    name,
    kind: "command",
    description,
    input: QuoteIdInputSchema,
    output: QuoteSchema,
    permission: "quote:write",
    handler: async ({ input: { id }, context }) => {
      const before = await loadQuote({ context, id });
      if (!before) return notFound({ entity: "Quote" });
      return moveQuote({ context, before, to });
    },
  });

export const declineQuote = closeQuote({
  name: "quote.decline",
  to: "DECLINED",
  description:
    "Record that the customer declined a SENT quote (ADR 0022). The ticket stays open: make a " +
    "new version with quote.revise or move the ticket to a terminal phase. Any other status is a CONFLICT.",
});

export const expireQuote = closeQuote({
  name: "quote.expire",
  to: "EXPIRED",
  description:
    "Expire a SENT quote that the customer did not accept in time (ADR 0022). A new version can " +
    "then be made with quote.revise. Any other status is a CONFLICT.",
});
