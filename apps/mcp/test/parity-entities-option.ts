import { byId, type ParityEntity, tool } from "./parity-entities";

/** An option (ADR 0022) on the bookable item, placed for the inquiry made earlier; it gets rank 1. */
const option = (): ParityEntity => ({
  ...byId({ name: "option", field: "option", list: "options", createTool: "", args: {} }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "option_create",
      args: {
        itemId: made.item.id,
        inquiryId: made.inquiry.id,
        startsAt: "2026-11-03T07:00:00.000Z",
        endsAt: "2026-11-03T15:00:00.000Z",
        expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      },
    }),
});

/** Options; a function so the import cycle with `parity-entities.ts` resolves first. */
export function optionEntities(): ParityEntity[] {
  return [option()];
}
