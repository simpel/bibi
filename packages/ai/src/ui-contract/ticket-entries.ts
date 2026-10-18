import { TicketSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a ticket as tool results carry it (dates = ISO strings). */
export const TicketWireSchema = TicketSchema.extend({
  desiredStartsAt: z.string().nullable(),
  desiredEndsAt: z.string().nullable(),
  holdsUntil: z.string().nullable(),
  phaseChangedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const TicketListWireSchema = z.object({
  items: z.array(TicketWireSchema),
  nextCursor: z.string().nullable(),
});

export type TicketWire = z.infer<typeof TicketWireSchema>;

const ticketTable = uiEntry({
  component: "ticket-table",
  schema: TicketListWireSchema,
  toProps: ({ value }) => value,
});
const ticketCard = uiEntry({
  component: "ticket-card",
  schema: TicketWireSchema,
  toProps: ({ value }) => ({ ticket: value }),
});

/** Tool → component for tickets (ADR 0043). */
export const TICKET_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  ticket_list: ticketTable,
  ticket_get: ticketCard,
  ticket_create: ticketCard,
  ticket_update: ticketCard,
  ticket_changePhase: ticketCard,
};
