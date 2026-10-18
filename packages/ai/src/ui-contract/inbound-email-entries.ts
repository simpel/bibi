import { InboundEmailSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a received mail as tool results carry it (dates = ISO strings). */
export const InboundEmailWireSchema = InboundEmailSchema.extend({
  receivedAt: z.string(),
  createdAt: z.string(),
});
export const InboundEmailListWireSchema = z.object({
  items: z.array(InboundEmailWireSchema),
  nextCursor: z.string().nullable(),
});

export type InboundEmailWire = z.infer<typeof InboundEmailWireSchema>;

/** Tool → component for mails received on a ticket's inbound address (ADR 0012). */
export const INBOUND_EMAIL_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  inboundEmail_list: uiEntry({
    component: "inbound-email-table",
    schema: InboundEmailListWireSchema,
    toProps: ({ value }) => value,
  }),
  inboundEmail_get: uiEntry({
    component: "inbound-email-card",
    schema: InboundEmailWireSchema,
    toProps: ({ value }) => ({ email: value }),
  }),
};
