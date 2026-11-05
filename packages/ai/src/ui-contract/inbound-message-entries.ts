import { InboundMessageSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { InboundEmailWire } from "./inbound-email-entries";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of an inbound message as tool results carry it (dates = ISO strings). */
export const InboundMessageWireSchema = InboundMessageSchema.extend({
  receivedAt: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export const InboundMessageListWireSchema = z.object({
  items: z.array(InboundMessageWireSchema),
  nextCursor: z.string().nullable(),
});

export type InboundMessageWire = z.infer<typeof InboundMessageWireSchema>;

/** Props of the inbound components: messages of every channel and the old mail cards. */
export type InboundUiProps = {
  "inbound-email-table": { items: InboundEmailWire[]; nextCursor: string | null };
  "inbound-email-card": { email: InboundEmailWire };
  "inbound-message-table": { items: InboundMessageWire[]; nextCursor: string | null };
  "inbound-message-card": { message: InboundMessageWire };
};

const card = uiEntry({
  component: "inbound-message-card",
  schema: InboundMessageWireSchema,
  toProps: ({ value }) => ({ message: value }),
});

/** Tool → component for inbound messages of every channel (ADR 0085). Untrusted content. */
export const INBOUND_MESSAGE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  inboundMessage_list: uiEntry({
    component: "inbound-message-table",
    schema: InboundMessageListWireSchema,
    toProps: ({ value }) => value,
  }),
  inboundMessage_get: card,
  inboundMessage_attachToOrder: card,
  inboundMessage_markRead: card,
  inboundMessage_markUnread: card,
  inboundMessage_delete: card,
};
