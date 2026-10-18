import {
  archiveTicketTemplate,
  createTicketTemplate,
  getTicketTemplate,
  listTicketTemplates,
  type TicketTemplateDto,
  TicketTemplateSchema,
  updateTicketTemplate,
} from "@okazi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const TicketTemplateRef = objectFromSchema<TicketTemplateDto>({
  name: "TicketTemplate",
  schema: TicketTemplateSchema,
  omit: ["organizationId"],
  description:
    "Ticket template – a predefined ticket: ticket type, start phase, default field values and " +
    "lines (item, setup, offset and duration from the ticket start, quantity).",
});
const TicketTemplatePageRef = pageType({ name: "TicketTemplatePage", item: TicketTemplateRef });

fieldFromOperation({
  operation: listTicketTemplates,
  type: TicketTemplatePageRef,
  name: "ticketTemplates",
});
fieldFromOperation({
  operation: getTicketTemplate,
  type: TicketTemplateRef,
  name: "ticketTemplate",
});
mutationFromOperation({ operation: createTicketTemplate, type: TicketTemplateRef });
mutationFromOperation({ operation: updateTicketTemplate, type: TicketTemplateRef });
mutationFromOperation({ operation: archiveTicketTemplate, type: TicketTemplateRef });
