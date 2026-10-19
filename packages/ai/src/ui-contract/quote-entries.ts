import { QuoteSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a quote as tool results carry it (dates = ISO strings). */
export const QuoteWireSchema = QuoteSchema.extend({
  validUntil: z.string().nullable(),
  statusChangedAt: z.string(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const QuoteListWireSchema = z.object({
  items: z.array(QuoteWireSchema),
  nextCursor: z.string().nullable(),
});

export type QuoteWire = z.infer<typeof QuoteWireSchema>;

const quoteTable = uiEntry({
  component: "quote-table",
  schema: QuoteListWireSchema,
  toProps: ({ value }) => value,
});
const quoteCard = uiEntry({
  component: "quote-card",
  schema: QuoteWireSchema,
  toProps: ({ value }) => ({ quote: value }),
});

/** Tool → component for quotes, their versions and status commands (ADR 0022). */
export const QUOTE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  quote_list: quoteTable,
  quote_get: quoteCard,
  quote_create: quoteCard,
  quote_update: quoteCard,
  quote_revise: quoteCard,
  quote_send: quoteCard,
  quote_accept: quoteCard,
  quote_decline: quoteCard,
  quote_expire: quoteCard,
};
