import { byId, type ParityEntity, tool } from "./parity-entities";

/** A run sheet over the parity type, field and list, going to the parity responsibility. */
export const runSheetDefinition: ParityEntity = {
  ...byId({
    name: "runSheetDefinition",
    field: "runSheetDefinition",
    list: "run-sheet-definitions",
    createTool: "",
    args: {},
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "runSheetDefinition_create",
      args: {
        name: "Parity kitchen order",
        entityTypeIds: [made.entityType.id],
        fieldIds: [made.fieldDefinition.id],
        vocabularyIds: [made.vocabulary.id],
        responsibilityId: made.responsibility.id,
      },
    }),
};

/** The first version of the parity order's run sheet (ADR 0021), from the definition above. */
export const runSheet = (): ParityEntity => ({
  ...byId({ name: "runSheet", field: "runSheet", list: "run-sheets", createTool: "", args: {} }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "runSheet_generate",
      args: { orderId: made.order.id, runSheetDefinitionId: made.runSheetDefinition.id },
    }),
});
