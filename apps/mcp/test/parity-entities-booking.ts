import { bookingInboundAddress, deliverInboundEmail } from "@okazi/core";
import type { Json } from "./helpers";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { assignment } from "./parity-entities-assignment";
import { requirement } from "./parity-entities-requirement";

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

const OCCURRENCE = "{ bookingId reference occurrenceIndex startsAt endsAt bookingStatusId clash }";

/** A recurring booking (ADR 0023) for the same customer and type as the booking above. */
const bookingSeries = (): ParityEntity => ({
  ...byId({
    name: "bookingSeries",
    field: "bookingSeries",
    list: "booking-series",
    createTool: "",
    args: {},
    nested: { occurrences: OCCURRENCE, clashes: OCCURRENCE },
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "bookingSeries_create",
      args: {
        entityTypeId: made.booking.entityTypeId,
        customerId: made.customer.id,
        rule: "FREQ=WEEKLY;BYDAY=TU;COUNT=3",
        startsAt: "2026-11-03T08:00:00.000Z",
        durationMinutes: 240,
      },
    }),
});

/** A program item (ADR 0022) on the booking, held in the bookable item with its setup. */
const programItem = (): ParityEntity => ({
  ...byId({
    name: "programItem",
    field: "programItem",
    list: "program-items",
    createTool: "",
    args: {},
  }),
  create: async ({ mcp, made }) => {
    const type = await tool({
      mcp,
      name: "entityType_create",
      args: { base: "PROGRAM_ITEM", name: "Parity session" },
    });
    return tool({
      mcp,
      name: "programItem_create",
      args: {
        bookingId: made.booking.id,
        entityTypeId: type.id,
        name: "Morning session",
        startsAt: "2026-11-03T09:00:00.000Z",
        endsAt: "2026-11-03T11:00:00.000Z",
        itemId: made.item.id,
        setupId: made.setup.id,
        quantity: 40,
        note: "Projector",
      },
    });
  },
});

/** An inquiry (ADR 0022) from the customer created earlier; it starts in status NEW. */
const inquiry = (): ParityEntity => ({
  ...byId({ name: "inquiry", field: "inquiry", list: "inquiries", createTool: "", args: {} }),
  create: async ({ mcp, made }) => {
    const type = await tool({
      mcp,
      name: "entityType_create",
      args: { base: "INQUIRY", name: "Parity inquiry" },
    });
    return tool({
      mcp,
      name: "inquiry_create",
      args: { entityTypeId: type.id, customerId: made.customer.id, quantity: 30 },
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

/** Bookings, inquiries and assignments; a function so the parity-entities import cycle resolves. */
export function bookingEntities(): ParityEntity[] {
  const sales = [inboundEmail(), inquiry(), assignment()];
  return [booking(), bookingSeries(), programItem(), requirement(), ...sales];
}
