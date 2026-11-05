import { byId, type ParityEntity, tool } from "./parity-entities";

const LINE =
  "id lineId itemId position name quantity unitPriceMinor priceUnit discountPercent vatRatePercent " +
  "tags totalExclVatMinor vatMinor vatRows parentLineId role alternativeGroupId alternativeGroupName " +
  "alternativeGroupChosen inTotal";

/** An alternative group (ADR 0052): the parity line and a second, untimed one as options. */
export const alternativeGroupEntity = (): ParityEntity => ({
  ...byId({
    name: "alternativeGroup",
    field: "alternativeGroup",
    list: "alternative-groups",
    createTool: "",
    args: {},
  }),
  create: async ({ mcp, made }) => {
    const other = await tool({
      mcp,
      name: "line_create",
      args: {
        orderId: made.order.id,
        entityTypeId: made.line.entityTypeId,
        name: "Afternoon session",
        unitPriceMinor: 90_000,
        quantity: 1,
        vatRatePercent: 12,
      },
    });
    return tool({
      mcp,
      name: "alternativeGroup_create",
      args: { orderId: made.order.id, name: "Session", lineIds: [made.line.id, other.id] },
    });
  },
});

/**
 * A quote (ADR 0022, 0052) to the order created earlier: a DRAFT that shows the order's priced
 * lines live; a function so the import cycle with `parity-entities.ts` resolves first.
 */
export const quoteEntity = (): ParityEntity => ({
  ...byId({
    name: "quote",
    field: "quote",
    list: "quotes",
    createTool: "",
    args: {},
    nested: {
      lines: `{ ${LINE} change changedFields }`,
      removedLines: `{ ${LINE} }`,
      orderChanges: `{ ${LINE} change changedFields }`,
      orderRemovedLines: `{ ${LINE} }`,
    },
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "quote_create",
      args: {
        orderId: made.order.id,
        validUntil: "2026-12-01T00:00:00.000Z",
        terms: "Net 30",
      },
    }),
});
