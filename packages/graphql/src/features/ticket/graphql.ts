import {
  changeTicketPhase,
  createTicket,
  createTicketFromTemplate,
  exportTicket,
  getTicket,
  listTickets,
  type TicketDto,
  type TicketExport,
  TicketExportOutputSchema,
  TicketSchema,
  updateTicket,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { runOperation } from "../../schema/run-operation";
import { CustomerRef } from "../customer/graphql";
import { EntityTypeRef } from "../entity-type/graphql";
import { TicketPhaseRef } from "../ticket-phase/graphql";

export const TicketRef = objectFromSchema<TicketDto>({
  name: "Ticket",
  schema: TicketSchema,
  omit: ["organizationId"],
  description:
    "Ticket – one customer request from first contact to the delivered event (ADR 0043): type " +
    "and fields, customer and contact, desired period, quantity, headcount, budget, the " +
    "organization's own phase and who answers for it (assignments).",
});
const TicketPageRef = pageType({ name: "TicketPage", item: TicketRef });
const TicketExportRef = objectFromSchema<TicketExport>({
  name: "TicketExport",
  schema: TicketExportOutputSchema,
  description: "A ticket exported as a versioned document for handover outside the system.",
});

fieldFromOperation({ operation: listTickets, type: TicketPageRef, name: "tickets" });
fieldFromOperation({ operation: getTicket, type: TicketRef, name: "ticket" });
fieldFromOperation({ operation: exportTicket, type: TicketExportRef, name: "ticketExport" });
mutationFromOperation({ operation: createTicket, type: TicketRef });
mutationFromOperation({ operation: createTicketFromTemplate, type: TicketRef });
mutationFromOperation({ operation: updateTicket, type: TicketRef });
mutationFromOperation({ operation: changeTicketPhase, type: TicketRef });

builder.objectField(TicketRef, "entityType", (t) =>
  t.field({
    type: EntityTypeRef,
    description: "The ticket type, with its fields.",
    resolve: (ticket, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:view" });
      return ctx.loaders.entityType.load({ id: ticket.entityTypeId }) as never;
    },
  }),
);

builder.objectField(TicketRef, "customer", (t) =>
  t.field({
    type: CustomerRef,
    nullable: true,
    description: "The customer who orders (null if archived).",
    resolve: (ticket, _args, ctx) => {
      requirePermission({ ctx, permission: "customer:view" });
      return ctx.loaders.customer.load({ id: ticket.customerId });
    },
  }),
);

builder.objectField(TicketRef, "phase", (t) =>
  t.field({
    type: TicketPhaseRef,
    description: "The ticket's phase, with its flags (archived phases included).",
    resolve: (ticket, _args, ctx) => {
      requirePermission({ ctx, permission: "pipeline:view" });
      return ctx.loaders.ticketPhase.load({ id: ticket.phaseId }) as never;
    },
  }),
);

builder.objectField(CustomerRef, "tickets", (t) =>
  t.field({
    type: [TicketRef],
    description: "The customer's tickets, newest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (customer, { limit }, ctx) => {
      const page = (await runOperation({
        operation: listTickets,
        input: { customerId: customer.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: TicketDto[] };
      return page.items;
    },
  }),
);
