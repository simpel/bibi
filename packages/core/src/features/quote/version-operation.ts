import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { loadOpenInquiry, nextVersion } from "./quote-rules";
import { QuoteIdInputSchema, QuoteSchema } from "./schema";
import { loadQuote } from "./to-quote-dto";
import { writeLines } from "./write-lines";

export const reviseQuote = defineOperation({
  name: "quote.revise",
  kind: "command",
  description:
    "Make a new version of the inquiry's latest quote (ADR 0022): a DRAFT with the next version " +
    "number that copies the validity, terms and lines (with their snapshots). Its lines are " +
    "marked ADDED, CHANGED or UNCHANGED against the version it was made from, and removed lines " +
    "are listed. Refused (CONFLICT) for an older version, a DRAFT (edit it instead), an " +
    "ACCEPTED quote or a closed inquiry.",
  input: QuoteIdInputSchema,
  output: QuoteSchema,
  permission: "quote:write",
  handler: async ({ input: { id }, context }) => {
    const source = await loadQuote({ context, id });
    if (!source) return notFound({ entity: "Quote" });
    if (source.quoteStatus === "DRAFT" || source.quoteStatus === "ACCEPTED") {
      return conflict({ message: `A ${source.quoteStatus} quote cannot get a new version` });
    }
    const { inquiryId } = source;
    const inquiry = await loadOpenInquiry({ context, inquiryId });
    if (!inquiry.ok) return inquiry;
    const version = await nextVersion({ context, inquiryId });
    if (version !== source.version + 1) {
      return conflict({ message: "Only the latest version of a quote can get a new version" });
    }
    const { validUntil, terms } = source;
    const row = await context.db.quote.create({
      data: {
        ...{ inquiryId, version, previousId: id, validUntil, terms },
        organizationId: context.organizationId,
      },
    });
    const lines = source.lines.map(({ id: _id, change: _c, changedFields: _f, ...line }) => line);
    await writeLines({ context, quoteId: row.id, lines });
    const quote = await loadQuote({ context, id: row.id });
    if (!quote) return notFound({ entity: "Quote" });
    context.recordChange({ entityId: row.id, after: quote });
    return ok({ value: quote });
  },
});
