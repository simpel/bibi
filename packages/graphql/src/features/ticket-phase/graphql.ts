import {
  archiveTicketPhase,
  createTicketPhase,
  getTicketPhase,
  importTicketPhaseTemplate,
  listTicketPhases,
  previewArchiveTicketPhase,
  reorderTicketPhases,
  setTicketPhaseTransitions,
  type TicketPhaseDto,
  type TicketPhaseImportResult,
  TicketPhaseSchema,
  updateTicketPhase,
} from "@okazi/core";
import { ArchivePreviewRef } from "../../schema/archive-preview";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const TicketPhaseRef = objectFromSchema<TicketPhaseDto>({
  name: "TicketPhase",
  schema: TicketPhaseSchema,
  omit: ["organizationId"],
  description:
    "Ticket phase – one of the organization's own phases, with its flags (entry, terminal, " +
    "requiresReason, requiresAssignee, invoiceable). `transitionsTo` lists the phases a ticket " +
    "may move to.",
});
const TicketPhasePageRef = pageType({ name: "TicketPhasePage", item: TicketPhaseRef });

const TicketPhaseImportRef = builder
  .objectRef<TicketPhaseImportResult>("TicketPhaseImport")
  .implement({
    description: "Result of importing a ticket phase template.",
    fields: (t) => ({
      created: t.field({ type: [TicketPhaseRef], resolve: (result) => result.created }),
      skipped: t.stringList({
        description: "Names that already existed",
        resolve: (result) => result.skipped,
      }),
      transitionsAdded: t.int({ resolve: (result) => result.transitionsAdded }),
    }),
  });

fieldFromOperation({
  operation: listTicketPhases,
  type: TicketPhasePageRef,
  name: "ticketPhases",
});
fieldFromOperation({ operation: getTicketPhase, type: TicketPhaseRef, name: "ticketPhase" });
mutationFromOperation({ operation: createTicketPhase, type: TicketPhaseRef });
mutationFromOperation({ operation: updateTicketPhase, type: TicketPhaseRef });
mutationFromOperation({ operation: archiveTicketPhase, type: TicketPhaseRef });
fieldFromOperation({
  operation: previewArchiveTicketPhase,
  type: ArchivePreviewRef,
  name: "ticketPhaseArchivePreview",
});
mutationFromOperation({ operation: reorderTicketPhases, type: TicketPhasePageRef });
mutationFromOperation({ operation: setTicketPhaseTransitions, type: TicketPhaseRef });
mutationFromOperation({ operation: importTicketPhaseTemplate, type: TicketPhaseImportRef });
