import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { restoreQuoteVersion } from "./accept-superseded";
import { moveQuote } from "./move-quote";
import { loadOpenOrder } from "./quote-rules";
import { QuoteIdInputSchema, QuoteSchema } from "./schema";
import { supersedeOthers } from "./supersede";
import { loadQuote } from "./to-quote-dto";
import { checkQuoteTransition } from "./transitions";

export const reopenQuote = defineOperation({
  name: "quote.reopen",
  kind: "command",
  description:
    "Set a SUPERSEDED quote as the current version again (ADR 0116): it is SENT again, the newer " +
    "SENT version becomes SUPERSEDED and the order is restored to the version this quote was " +
    "sent as (orderVersion.restore, needs program:write). Nothing is accepted: record the " +
    "customer's answer with quote.accept or quote.decline. The quote must still be valid and the " +
    "order must not be in a closing status. Any other starting status is a CONFLICT.",
  input: QuoteIdInputSchema,
  output: QuoteSchema,
  permission: "quote:write",
  handler: async ({ input: { id }, context }) => {
    const before = await loadQuote({ context, id });
    if (!before) return notFound({ entity: "Quote" });
    const allowed = checkQuoteTransition({ from: before.quoteStatus, to: "SENT" });
    if (!allowed.ok || before.quoteStatus !== "SUPERSEDED") {
      return conflict({ message: "Only a superseded quote can be set as the current version" });
    }
    if (!before.validUntil || before.validUntil <= nowOf({ context })) {
      return conflict({ message: "The quote is no longer valid, so it cannot be set as current" });
    }
    const order = await loadOpenOrder({ context, orderId: before.orderId });
    if (!order.ok) return order;
    const restored = await restoreQuoteVersion({ context, quote: before });
    if (!restored.ok) return restored;
    const superseded = await supersedeOthers({ context, quote: before });
    if (!superseded.ok) return superseded;
    return moveQuote({ context, before, to: "SENT" });
  },
});
