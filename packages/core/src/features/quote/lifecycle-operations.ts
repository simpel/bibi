import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { chooseOnAccept } from "../alternative-group/choose-on-accept";
import { moveOnQuoteEvent } from "./move-on-event";
import { moveQuote } from "./move-quote";
import { loadOpenOrder } from "./quote-rules";
import {
  QuoteAcceptInputSchema,
  QuoteIdInputSchema,
  QuoteSchema,
  type QuoteStatus,
} from "./schema";
import { loadQuote } from "./to-quote-dto";
import { checkQuoteTransition } from "./transitions";

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
    "Record that the customer declined a SENT quote (ADR 0022). The order stays open: make a " +
    "new version with quote.revise or move the order to a closing status. Any other status is a CONFLICT.",
});

export const expireQuote = closeQuote({
  name: "quote.expire",
  to: "EXPIRED",
  description:
    "Expire a SENT quote that the customer did not accept in time (ADR 0022). A new version can " +
    "then be made with quote.revise. Any other status is a CONFLICT.",
});

export const acceptQuote = defineOperation({
  name: "quote.accept",
  kind: "command",
  description:
    "Record that the customer accepted a SENT quote (ADR 0022). Stores who recorded it " +
    "(`acceptedBy`), when (`acceptedAt`) and `acceptanceMethod` MANUAL, and creates no other " +
    "record. The order must not be in a closing status. The order moves into the status with " +
    "the QUOTE_ACCEPTED event, if there is one and the organization allows the move from its " +
    "current status (needs order:write); its lines move through that status's grid. A blocked " +
    "move fails the accept without any change. Any other starting status is a CONFLICT. " +
    "chosenLineIds records the customer's pick per alternative group first (ADR 0052): the " +
    "other options are released, as alternativeGroup.choose does.",
  input: QuoteAcceptInputSchema,
  output: QuoteSchema,
  permission: "quote:write",
  handler: async ({ input: { id, chosenLineIds = [] }, context }) => {
    const before = await loadQuote({ context, id });
    if (!before) return notFound({ entity: "Quote" });
    const allowed = checkQuoteTransition({ from: before.quoteStatus, to: "ACCEPTED" });
    if (!allowed.ok) return allowed;
    const order = await loadOpenOrder({ context, orderId: before.orderId });
    if (!order.ok) return order;
    const chosen = await chooseOnAccept({ context, orderId: before.orderId, chosenLineIds });
    if (!chosen.ok) return chosen;
    const extra = {
      acceptedBy: context.actor.userId,
      acceptedAt: new Date(),
      acceptanceMethod: "MANUAL",
    } as const;
    const accepted = await moveQuote({ context, before, to: "ACCEPTED", extra });
    if (!accepted.ok) return accepted;
    const event = "QUOTE_ACCEPTED";
    const moved = await moveOnQuoteEvent({ context, orderId: before.orderId, event });
    return moved.ok ? accepted : moved;
  },
});
