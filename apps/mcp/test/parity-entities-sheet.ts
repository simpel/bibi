import { byId, type ParityEntity, tool } from "./parity-entities";

/** A sheet over the parity type, field and list, going to the fixed owner role. */
export const sheetDefinition: ParityEntity = {
  ...byId({
    name: "sheetDefinition",
    field: "sheetDefinition",
    list: "sheet-definitions",
    createTool: "",
    args: {},
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "sheetDefinition_create",
      args: {
        name: "Parity kitchen order",
        entityTypeIds: [made.entityType.id],
        fieldIds: [made.fieldDefinition.id],
        vocabularyIds: [made.vocabulary.id],
        roleId: "admin",
      },
    }),
};

/** The first version of the parity ticket's sheet (ADR 0021), from the definition above. */
export const sheet = (): ParityEntity => ({
  ...byId({ name: "sheet", field: "sheet", list: "sheets", createTool: "", args: {} }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "sheet_generate",
      args: { ticketId: made.ticket.id, sheetDefinitionId: made.sheetDefinition.id },
    }),
});
