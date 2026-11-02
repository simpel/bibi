import {
  generateWorkOrder,
  getWorkOrder,
  listWorkOrders,
  sendWorkOrder,
  type WorkOrderDto,
  WorkOrderSchema,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { TicketRef } from "../ticket/graphql";

export const WorkOrderRef = objectFromSchema<WorkOrderDto>({
  name: "WorkOrder",
  schema: WorkOrderSchema,
  omit: ["organizationId"],
  description:
    "Work order – one version of a ticket's compilation for a role (e.g. a kitchen order): the " +
    "snapshot `content`, and the `changes` marked ★ since the last sent version.",
});
const WorkOrderPageRef = pageType({ name: "WorkOrderPage", item: WorkOrderRef });

fieldFromOperation({ operation: listWorkOrders, type: WorkOrderPageRef, name: "workOrders" });
fieldFromOperation({ operation: getWorkOrder, type: WorkOrderRef, name: "workOrder" });
mutationFromOperation({ operation: generateWorkOrder, type: WorkOrderRef });
mutationFromOperation({ operation: sendWorkOrder, type: WorkOrderRef });

// Graph edge; it lives here so that ticket/graphql.ts need not import this.
builder.objectField(TicketRef, "workOrders", (t) =>
  t.field({
    type: [WorkOrderRef],
    description: "The ticket's work order versions, newest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (ticket, { limit }, ctx) => {
      const input = { ticketId: ticket.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) };
      const page = (await runOperation({ operation: listWorkOrders, input, ctx })) as {
        items: WorkOrderDto[];
      };
      return page.items;
    },
  }),
);
