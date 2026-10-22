import { TicketTemplateSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a predefined ticket as tool results carry it (dates = ISO strings). */
export const TicketTemplateWireSchema = TicketTemplateSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const TicketTemplateListWireSchema = z.object({
  items: z.array(TicketTemplateWireSchema),
  nextCursor: z.string().nullable(),
});

export type TicketTemplateWire = z.infer<typeof TicketTemplateWireSchema>;

const templateTable = uiEntry({
  component: "ticket-template-table",
  schema: TicketTemplateListWireSchema,
  toProps: ({ value }) => value,
});
const templateCard = uiEntry({
  component: "ticket-template-card",
  schema: TicketTemplateWireSchema,
  toProps: ({ value }) => ({ template: value }),
});

/** Tool → component for the organization's predefined tickets (ADR 0043). */
export const TICKET_TEMPLATE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  ticketTemplate_list: templateTable,
  ticketTemplate_get: templateCard,
  ticketTemplate_create: templateCard,
  ticketTemplate_update: templateCard,
  ticketTemplate_archive: templateCard,
};
