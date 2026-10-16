import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { checkDraft, loadOpenInquiry } from "./quote-rules";
import { QuoteCreateInputSchema, QuoteSchema, QuoteUpdateInputSchema } from "./schema";
import { snapshotLines } from "./snapshot-lines";
import { loadQuote } from "./to-quote-dto";
import { writeLines } from "./write-lines";

export const createQuote = defineOperation({
  name: "quote.create",
  kind: "command",
  description:
    "Create the first quote (version 1, status DRAFT) for an open inquiry (ADR 0022). Each line " +
    "copies the item's name, price, VAT and contained tags (snapshot); the totals are the sums " +
    "of the lines. The quote has no owner of its own; it uses the inquiry's. An inquiry that already has a " +
    "quote gets a new version with quote.revise instead (CONFLICT).",
  input: QuoteCreateInputSchema,
  output: QuoteSchema,
  permission: "quote:write",
  handler: async ({ input: { inquiryId, lines = [], ...terms }, context }) => {
    const inquiry = await loadOpenInquiry({ context, inquiryId });
    if (!inquiry.ok) return inquiry;
    if ((await context.db.quote.count({ where: { inquiryId } })) > 0) {
      return conflict({ message: "The inquiry already has a quote; make a new version instead" });
    }
    const { customerId } = inquiry.value;
    const data = await snapshotLines({ context, lines, customerId, existing: [] });
    if (!data.ok) return data;
    const row = await context.db.quote.create({
      data: { ...terms, inquiryId, version: 1, organizationId: context.organizationId },
    });
    await writeLines({ context, quoteId: row.id, lines: data.value });
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
    "Change a DRAFT quote's validity, terms or lines. Omitted properties are unchanged; `lines` " +
    "replaces the whole set (pass `lineId` to keep a line's snapshot). A quote that is not a " +
    "DRAFT cannot be changed (CONFLICT): make a new version with quote.revise. The status " +
    "changes only with quote.send, quote.decline and quote.expire.",
  input: QuoteUpdateInputSchema,
  output: QuoteSchema,
  permission: "quote:write",
  handler: async ({ input: { id, lines, ...terms }, context }) => {
    const before = await loadQuote({ context, id });
    if (!before) return notFound({ entity: "Quote" });
    const draft = checkDraft({ quote: before });
    if (!draft.ok) return draft;
    const inquiry = await loadOpenInquiry({ context, inquiryId: before.inquiryId });
    if (!inquiry.ok) return inquiry;
    if (lines) {
      const { customerId } = inquiry.value;
      const data = await snapshotLines({ context, lines, customerId, existing: before.lines });
      if (!data.ok) return data;
      await writeLines({ context, quoteId: id, lines: data.value });
    }
    await context.db.quote.update({ where: { id }, data: terms });
    const after = await loadQuote({ context, id });
    if (!after) return notFound({ entity: "Quote" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
