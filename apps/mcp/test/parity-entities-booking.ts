import { byId, type ParityEntity, tool } from "./parity-entities";

/**
 * A booking (ADR 0022) for the customer created earlier. It gets the default TENTATIVE status,
 * so it comes after the booking status entity.
 */
const booking = (): ParityEntity => ({
  ...byId({ name: "booking", field: "booking", list: "bookings", createTool: "", args: {} }),
  create: async ({ mcp, made }) => {
    const type = await tool({
      mcp,
      name: "entityType_create",
      args: { base: "BOOKING", name: "Parity conference" },
    });
    return tool({
      mcp,
      name: "booking_create",
      args: {
        entityTypeId: type.id,
        customerId: made.customer.id,
        startsAt: "2026-11-03T08:00:00.000Z",
        endsAt: "2026-11-03T16:00:00.000Z",
        estimatedHeadcount: 12,
      },
    });
  },
});

/** Bookings; a function so the import cycle with `parity-entities.ts` resolves first. */
export function bookingEntities(): ParityEntity[] {
  return [booking()];
}
