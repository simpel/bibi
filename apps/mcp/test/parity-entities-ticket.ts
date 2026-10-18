import { deliverInboundEmail, ticketInboundAddress } from "@okazi/core";
import type { Json } from "./helpers";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { assignment } from "./parity-entities-assignment";
import { requirement } from "./parity-entities-requirement";

/**
 * A ticket (ADR 0043) for the customer created earlier. It starts in the entry phase, so it comes
 * after the ticket phase entity.
 */
const ticket = (): ParityEntity => ({
  ...byId({ name: "ticket", field: "ticket", list: "tickets", createTool: "", args: {} }),
  create: async ({ mcp, made }) => {
    const type = await tool({
      mcp,
      name: "entityType_create",
      args: { base: "TICKET", name: "Parity conference" },
    });
    return tool({
      mcp,
      name: "ticket_create",
      args: {
        entityTypeId: type.id,
        customerId: made.customer.id,
        desiredStartsAt: "2026-11-03T08:00:00.000Z",
        desiredEndsAt: "2026-11-03T16:00:00.000Z",
        estimatedHeadcount: 12,
      },
    });
  },
});

/** A program item (ADR 0022) on the ticket, held in the bookable item with its setup. */
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
        ticketId: made.ticket.id,
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

const domain = "in.parity.test";

/**
 * A received mail (ADR 0012). There is no user command that creates one: the inbound webhook
 * stores it as SYSTEM, so the parity test delivers it the same way to the ticket made above.
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
    const address = ticketInboundAddress({ ticketId: made.ticket.id, domain });
    const delivered = await deliverInboundEmail({
      domain,
      mail: {
        providerEmailId: `email_${made.ticket.id}`,
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

/** Tickets and what hangs off them; a function so the parity-entities import cycle resolves. */
export function ticketEntities(): ParityEntity[] {
  const sales = [inboundEmail(), assignment()];
  return [ticket(), programItem(), requirement(), ...sales];
}
