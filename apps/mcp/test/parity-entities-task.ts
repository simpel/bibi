import { byId, type ParityEntity, tool } from "./parity-entities";

/** A task (ADR 0117, 0120) at the parity customer, linked to the parity order. */
export const task = (): ParityEntity => ({
  ...byId({ name: "task", field: "task", list: "tasks", createTool: "", args: {} }),
  create: async ({ mcp, made }) => {
    const type = await tool({
      mcp,
      name: "entityType_create",
      args: { base: "TASK", name: "Parity site visit" },
    });
    return tool({
      mcp,
      name: "task_create",
      args: {
        entityTypeId: type.id,
        customerId: made.customer.id,
        contactId: made.contact.id,
        orderId: made.order.id,
        dueAt: "2037-11-02T13:00:00.000Z",
        note: "Show the hall",
      },
    });
  },
});
