import { byId, type ParityEntity, tool } from "./parity-entities";

/** A work order over the parity type, field and list, going to the parity responsibility. */
export const workOrderDefinition: ParityEntity = {
  ...byId({
    name: "workOrderDefinition",
    field: "workOrderDefinition",
    list: "work-order-definitions",
    createTool: "",
    args: {},
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "workOrderDefinition_create",
      args: {
        name: "Parity kitchen order",
        entityTypeIds: [made.entityType.id],
        fieldIds: [made.fieldDefinition.id],
        vocabularyIds: [made.vocabulary.id],
        responsibilityId: made.responsibility.id,
      },
    }),
};

/** The first version of the parity ticket's work order (ADR 0021), from the definition above. */
export const workOrder = (): ParityEntity => ({
  ...byId({ name: "workOrder", field: "workOrder", list: "work-orders", createTool: "", args: {} }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "workOrder_generate",
      args: { ticketId: made.ticket.id, workOrderDefinitionId: made.workOrderDefinition.id },
    }),
});
