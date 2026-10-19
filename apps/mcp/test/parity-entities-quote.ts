import { byId, type ParityEntity, tool } from "./parity-entities";

const LINE =
  "id lineId itemId position name quantity unitPriceMinor priceUnit discountPercent vatRatePercent " +
  "tags totalExclVatMinor vatMinor";

/**
 * A quote (ADR 0022, 0052) to the ticket created earlier: a DRAFT that shows the ticket's priced
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
      ticketChanges: `{ ${LINE} change changedFields }`,
      ticketRemovedLines: `{ ${LINE} }`,
    },
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "quote_create",
      args: {
        ticketId: made.ticket.id,
        validUntil: "2026-12-01T00:00:00.000Z",
        terms: "Net 30",
      },
    }),
});
