import { TicketPhaseSchema } from "@bibi/core/schemas";
import { z } from "zod";
import { archivePreviewEntry } from "./archive-preview-entry";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a ticket phase as tool results carry it (dates = ISO strings). */
export const TicketPhaseWireSchema = TicketPhaseSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const TicketPhaseListWireSchema = z.object({
  items: z.array(TicketPhaseWireSchema),
  nextCursor: z.string().nullable(),
});
/** `ticketPhase_importTemplate` output: the phases it created. */
export const TicketPhaseImportWireSchema = z.object({
  created: z.array(TicketPhaseWireSchema),
  skipped: z.array(z.string()),
  transitionsAdded: z.number(),
});

export type TicketPhaseWire = z.infer<typeof TicketPhaseWireSchema>;

const phaseTable = uiEntry({
  component: "ticket-phase-table",
  schema: TicketPhaseListWireSchema,
  toProps: ({ value }) => value,
});
const phaseCard = uiEntry({
  component: "ticket-phase-card",
  schema: TicketPhaseWireSchema,
  toProps: ({ value }) => ({ phase: value }),
});

/** Tool → component for the organization's ticket phases (ADR 0043). */
export const TICKET_PHASE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  ticketPhase_list: phaseTable,
  ticketPhase_get: phaseCard,
  ticketPhase_create: phaseCard,
  ticketPhase_update: phaseCard,
  ticketPhase_archive: phaseCard,
  ticketPhase_archivePreview: archivePreviewEntry,
  ticketPhase_reorder: phaseTable,
  ticketPhase_setTransitions: phaseCard,
  ticketPhase_importTemplate: uiEntry({
    component: "ticket-phase-table",
    schema: TicketPhaseImportWireSchema,
    toProps: ({ value }) => ({ items: value.created, nextCursor: null }),
  }),
};
