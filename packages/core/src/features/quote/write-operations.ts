import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { checkDraft, loadOpenOrder } from "./quote-rules";
import { QuoteCreateInputSchema, QuoteSchema, QuoteUpdateInputSchema } from "./schema";
import { loadQuote } from "./to-quote-dto";

export const createQuote = defineOperation({
  name: "quote.create",
  kind: "command",
  description:
    "Create the first quote (version 1, status DRAFT) for an open order (ADR 0022, 0052). A " +
    "DRAFT stores no lines: it shows the order's priced lines live (add or change them with " +
    "line.create and line.update) with derived totals, and quote.send freezes them. The quote " +
    "has no owner of its own; it uses the order's. An order that already has a quote gets a " +
    "new version with quote.revise instead (CONFLICT).",
  input: QuoteCreateInputSchema,
  output: QuoteSchema,
  permission: "quote:write",
  handler: async ({ input: { orderId, ...terms }, context }) => {
    const order = await loadOpenOrder({ context, orderId });
    if (!order.ok) return order;
    if ((await context.db.quote.count({ where: { orderId } })) > 0) {
      return conflict({ message: "The order already has a quote; make a new version instead" });
    }
    const row = await context.db.quote.create({
      data: { ...terms, orderId, version: 1, organizationId: context.organizationId },
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
    "the order's own: change them with line.update (ADR 0052). A quote that is not a DRAFT " +
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
    const order = await loadOpenOrder({ context, orderId: before.orderId });
    if (!order.ok) return order;
    await context.db.quote.update({ where: { id }, data: terms });
    const after = await loadQuote({ context, id });
    if (!after) return notFound({ entity: "Quote" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
