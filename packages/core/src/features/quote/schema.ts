import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { OrderLineSchema } from "./order-line-schema";

/** The quote's fixed status (ADR 0022); the allowed moves are in `transitions.ts`. */
export const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"] as const;
export const QuoteStatusSchema = z.enum(QUOTE_STATUSES);

/** How an acceptance was recorded; staff entry is the only way so far (ADR 0022). */
export const ACCEPTANCE_METHODS = ["MANUAL"] as const;
export const AcceptanceMethodSchema = z.enum(ACCEPTANCE_METHODS);

/** How a line differs from the previous version of the quote. */
export const LINE_CHANGES = ["ADDED", "CHANGED", "UNCHANGED"] as const;
export const LineChangeSchema = z.enum(LINE_CHANGES);

export const QuoteLineSchema = OrderLineSchema.extend({
  change: LineChangeSchema.nullable().describe(
    "Against the previous version: ADDED, CHANGED or UNCHANGED; null on version 1",
  ),
  changedFields: z
    .array(z.string())
    .describe("The line properties that differ from the previous version (CHANGED only)"),
});

export const QuoteSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  ticketId: z.string(),
  version: z.number().int().describe("1 for the first quote of the ticket, then +1 per version"),
  previousId: z.string().nullable().describe("The version this one was made from"),
  /** Changed only by the quote's own commands (`quote.send`, `quote.accept`, …). */
  quoteStatus: QuoteStatusSchema,
  validUntil: z.date().nullable(),
  terms: z.string().nullable(),
  totalExclVatMinor: z
    .number()
    .int()
    .describe("Sum of the lines excl. VAT, minor units; frozen when sent, live on a DRAFT"),
  totalInclVatMinor: z.number().int().describe("Sum of the lines incl. VAT, minor units"),
  statusChangedAt: z.date(),
  acceptedBy: z.string().nullable().describe("User id of who recorded the acceptance"),
  acceptedAt: z.date().nullable().describe("When the acceptance was recorded"),
  acceptanceMethod: AcceptanceMethodSchema.nullable().describe("How the acceptance was recorded"),
  lines: z
    .array(QuoteLineSchema)
    .describe("A DRAFT: the ticket's priced lines now (live). Sent: the frozen snapshot"),
  removedLines: z
    .array(OrderLineSchema)
    .describe("Lines of the previous version that this version no longer has"),
  differsFromTicket: z
    .boolean()
    .nullable()
    .describe("ACCEPTED only: the ticket's priced lines differ from this snapshot; else null"),
  ticketChanges: z
    .array(QuoteLineSchema)
    .describe("ACCEPTED only: the ticket's lines now that are ADDED or CHANGED against it"),
  ticketRemovedLines: z
    .array(OrderLineSchema)
    .describe("ACCEPTED only: accepted lines the ticket no longer has (removed or unpriced)"),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const QuoteTermsShape = {
  validUntil: z.coerce
    .date()
    .nullish()
    .describe("Last day the customer can accept, ISO 8601; required to send"),
  terms: z.string().trim().max(10_000).nullish().describe("Terms text shown on the quote"),
};

export const QuoteCreateInputSchema = z.object({
  ticketId: z.string().min(1).describe("Id of the open ticket the quote answers (ticket.list)"),
  ...QuoteTermsShape,
});

/**
 * Status is not here: it changes only through the quote's own commands. Lines are not here either:
 * they are the ticket's lines (line.update), ADR 0052.
 */
export const QuoteUpdateInputSchema = z.object({ id: z.string().min(1), ...QuoteTermsShape });

export const QuoteIdInputSchema = z.object({ id: z.string().min(1) });

export const QuoteListInputSchema = z.object({
  ticketId: z.string().optional().describe("Only the versions of this ticket's quote"),
  quoteStatus: QuoteStatusSchema.optional().describe("Only quotes with this status"),
  ...PageInputShape,
});

export const QuoteListOutputSchema = z.object({
  items: z.array(QuoteSchema),
  nextCursor: z.string().nullable(),
});

export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;
export type LineChange = z.infer<typeof LineChangeSchema>;
export type QuoteLineDto = z.infer<typeof QuoteLineSchema>;
export type QuoteDto = z.infer<typeof QuoteSchema>;
export type QuoteCreateInput = z.infer<typeof QuoteCreateInputSchema>;
export type QuoteUpdateInput = z.infer<typeof QuoteUpdateInputSchema>;
export type QuoteIdInput = z.infer<typeof QuoteIdInputSchema>;
export type QuoteListInput = z.infer<typeof QuoteListInputSchema>;
