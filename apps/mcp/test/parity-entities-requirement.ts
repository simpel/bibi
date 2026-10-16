import { byId, type ParityEntity, tool } from "./parity-entities";

/** A requirement (ADR 0021) counting the parity list value on the parity program item. */
export const requirement = (): ParityEntity => ({
  ...byId({
    name: "requirement",
    field: "requirement",
    list: "requirements",
    createTool: "",
    args: {},
  }),
  create: async ({ mcp, made }) => {
    const type = await tool({
      mcp,
      name: "entityType_create",
      args: { base: "REQUIREMENT", name: "Parity requirement" },
    });
    return tool({
      mcp,
      name: "requirement_create",
      args: {
        bookingId: made.booking.id,
        programItemId: made.programItem.id,
        entityTypeId: type.id,
        vocabularyValueId: made.vocabularyValue.id,
        quantity: 3,
      },
    });
  },
});
