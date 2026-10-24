import { TicketStatusSchema } from "@bibi/core/schemas";
import { z } from "zod";
import { archivePreviewEntry } from "./archive-preview-entry";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a ticket status as tool results carry it (dates = ISO strings). */
export const TicketStatusWireSchema = TicketStatusSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const TicketStatusListWireSchema = z.object({
  items: z.array(TicketStatusWireSchema),
  nextCursor: z.string().nullable(),
});
/** `ticketStatus_importTemplate` output: the statuses it created. */
export const TicketStatusImportWireSchema = z.object({
  created: z.array(TicketStatusWireSchema),
  skipped: z.array(z.string()),
  transitionsAdded: z.number(),
});

export type TicketStatusWire = z.infer<typeof TicketStatusWireSchema>;

const statusTable = uiEntry({
  component: "ticket-status-table",
  schema: TicketStatusListWireSchema,
  toProps: ({ value }) => value,
});
const statusCard = uiEntry({
  component: "ticket-status-card",
  schema: TicketStatusWireSchema,
  toProps: ({ value }) => ({ ticketStatus: value }),
});

/** Tool → component for the organization's ticket statuses (ADR 0043). */
export const TICKET_STATUS_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  ticketStatus_list: statusTable,
  ticketStatus_get: statusCard,
  ticketStatus_create: statusCard,
  ticketStatus_update: statusCard,
  ticketStatus_archive: statusCard,
  ticketStatus_archivePreview: archivePreviewEntry,
  ticketStatus_reorder: statusTable,
  ticketStatus_setTransitions: statusCard,
  ticketStatus_importTemplate: uiEntry({
    component: "ticket-status-table",
    schema: TicketStatusImportWireSchema,
    toProps: ({ value }) => ({ items: value.created, nextCursor: null }),
  }),
};
