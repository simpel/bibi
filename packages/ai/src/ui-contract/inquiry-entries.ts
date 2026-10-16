import { InquirySchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of an inquiry as tool results carry it (dates = ISO strings). */
export const InquiryWireSchema = InquirySchema.extend({
  desiredStartsAt: z.string().nullable(),
  desiredEndsAt: z.string().nullable(),
  statusChangedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const InquiryListWireSchema = z.object({
  items: z.array(InquiryWireSchema),
  nextCursor: z.string().nullable(),
});

export type InquiryWire = z.infer<typeof InquiryWireSchema>;

const inquiryTable = uiEntry({
  component: "inquiry-table",
  schema: InquiryListWireSchema,
  toProps: ({ value }) => value,
});
const inquiryCard = uiEntry({
  component: "inquiry-card",
  schema: InquiryWireSchema,
  toProps: ({ value }) => ({ inquiry: value }),
});

/** Tool → component for inquiries, their status commands and owner (ADR 0022). */
export const INQUIRY_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  inquiry_list: inquiryTable,
  inquiry_get: inquiryCard,
  inquiry_create: inquiryCard,
  inquiry_update: inquiryCard,
  inquiry_qualify: inquiryCard,
  inquiry_markLost: inquiryCard,
  inquiry_assign: inquiryCard,
};
