import {
  archiveTicketStatus,
  createTicketStatus,
  getTicketStatus,
  importTicketStatusTemplate,
  listTicketStatuses,
  previewArchiveTicketStatus,
  reorderTicketStatuses,
  setTicketStatusTransitions,
  type TicketStatusDto,
  type TicketStatusImportResult,
  TicketStatusSchema,
  updateTicketStatus,
} from "@bibi/core";
import { ArchivePreviewRef } from "../../schema/archive-preview";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const TicketStatusRef = objectFromSchema<TicketStatusDto>({
  name: "TicketStatus",
  schema: TicketStatusSchema,
  omit: ["organizationId"],
  description:
    "Ticket status – one of the organization's own statuses, with its flags (entry, closing, " +
    "invoiceable). `transitionsTo` lists the statuses a ticket may move to and " +
    "`transitionGates` the gates on those moves (ADR 0067).",
});
const TicketStatusPageRef = pageType({ name: "TicketStatusPage", item: TicketStatusRef });

const TicketStatusImportRef = builder
  .objectRef<TicketStatusImportResult>("TicketStatusImport")
  .implement({
    description: "Result of importing a ticket status template.",
    fields: (t) => ({
      created: t.field({ type: [TicketStatusRef], resolve: (result) => result.created }),
      skipped: t.stringList({
        description: "Names that already existed",
        resolve: (result) => result.skipped,
      }),
      transitionsAdded: t.int({ resolve: (result) => result.transitionsAdded }),
    }),
  });

fieldFromOperation({
  operation: listTicketStatuses,
  type: TicketStatusPageRef,
  name: "ticketStatuses",
});
fieldFromOperation({ operation: getTicketStatus, type: TicketStatusRef, name: "ticketStatus" });
mutationFromOperation({ operation: createTicketStatus, type: TicketStatusRef });
mutationFromOperation({ operation: updateTicketStatus, type: TicketStatusRef });
mutationFromOperation({ operation: archiveTicketStatus, type: TicketStatusRef });
fieldFromOperation({
  operation: previewArchiveTicketStatus,
  type: ArchivePreviewRef,
  name: "ticketStatusArchivePreview",
});
mutationFromOperation({ operation: reorderTicketStatuses, type: TicketStatusPageRef });
mutationFromOperation({ operation: setTicketStatusTransitions, type: TicketStatusRef });
mutationFromOperation({ operation: importTicketStatusTemplate, type: TicketStatusImportRef });
