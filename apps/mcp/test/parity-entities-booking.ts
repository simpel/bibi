import { bookingInboundAddress, deliverInboundEmail } from "@okazi/core";
import type { Json } from "./helpers";
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

const domain = "in.parity.test";

/**
 * A received mail (ADR 0012). There is no user command that creates one: the inbound webhook
 * stores it as SYSTEM, so the parity test delivers it the same way to the booking made above.
 */
const inboundEmail = (): ParityEntity => ({
  ...byId({
    name: "inboundEmail",
    field: "inboundEmail",
    list: "inbound-emails",
    createTool: "",
    args: {},
  }),
  create: async ({ made }) => {
    const address = bookingInboundAddress({ bookingId: made.booking.id, domain });
    const delivered = await deliverInboundEmail({
      domain,
      mail: {
        providerEmailId: `email_${made.booking.id}`,
        messageId: null,
        fromAddress: "Guest <guest@example.test>",
        toAddresses: [address],
        subject: "Re: parity",
        text: "Hej",
        html: null,
        attachments: [{ id: "att_1", filename: "a.pdf", contentType: null, size: 1 }],
        receivedAt: new Date("2026-11-01T08:00:00.000Z"),
        recipients: [address],
      },
    });
    if (!delivered.ok || delivered.value.status === "unmatched") throw new Error("Not stored");
    return JSON.parse(JSON.stringify(delivered.value.inboundEmail)) as Json;
  },
});

/** Bookings; a function so the import cycle with `parity-entities.ts` resolves first. */
export function bookingEntities(): ParityEntity[] {
  return [booking(), inboundEmail()];
}
