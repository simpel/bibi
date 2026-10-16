import { byId, type ParityEntity, tool } from "./parity-entities";

const LINE =
  "id itemId position name quantity unitPriceMinor priceUnit discountPercent vatRatePercent " +
  "tags totalExclVatMinor vatMinor";

/**
 * A quote (ADR 0022) to the inquiry created earlier, with a line that copies the room; a
 * function so the import cycle with `parity-entities.ts` resolves first.
 */
export const quoteEntity = (): ParityEntity => ({
  ...byId({
    name: "quote",
    field: "quote",
    list: "quotes",
    createTool: "",
    args: {},
    nested: { lines: `{ ${LINE} change changedFields }`, removedLines: `{ ${LINE} }` },
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "quote_create",
      args: {
        inquiryId: made.inquiry.id,
        validUntil: "2026-12-01T00:00:00.000Z",
        terms: "Net 30",
        lines: [{ itemId: made.item.id, quantity: 2, discountPercent: 10 }],
      },
    }),
});
