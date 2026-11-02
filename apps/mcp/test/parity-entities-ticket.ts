import type { Json } from "./helpers";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { allocationEntities } from "./parity-entities-allocation";
import { assignment } from "./parity-entities-assignment";
import { inboundEntities } from "./parity-entities-inbound";
import { requirement } from "./parity-entities-requirement";

/**
 * A ticket (ADR 0043) for the customer created earlier. It starts in the entry status, so it comes
 * after the ticket status entity.
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
        contactId: made.contact.id,
        desiredStartsAt: "2026-11-03T08:00:00.000Z",
        desiredEndsAt: "2026-11-03T16:00:00.000Z",
        estimatedHeadcount: 12,
      },
    });
  },
});

/** A line (ADR 0022) on the ticket, held in the bookable item with its setup. */
const line = (): ParityEntity => ({
  ...byId({
    name: "line",
    field: "line",
    list: "lines",
    createTool: "",
    args: {},
  }),
  create: async ({ mcp, made }) => {
    const type = await tool({
      mcp,
      name: "entityType_create",
      args: { base: "LINE", name: "Parity session" },
    });
    return tool({
      mcp,
      name: "line_create",
      args: {
        ticketId: made.ticket.id,
        entityTypeId: type.id,
        name: "Morning session",
        startsAt: "2026-11-03T09:00:00.000Z",
        endsAt: "2026-11-03T11:00:00.000Z",
        itemId: made.item.id,
        setupId: made.setup.id,
        quantity: 40,
        unitPriceMinor: 120_000,
        discountPercent: 10,
        note: "Projector",
      },
    });
  },
});

/** A predefined ticket (ADR 0043): its own types, the status made earlier and the item as a line. */
const ticketTemplate = (): ParityEntity => ({
  ...byId({
    name: "ticketTemplate",
    field: "ticketTemplate",
    list: "ticket-templates",
    createTool: "",
    args: {},
  }),
  create: async ({ mcp, made }) => {
    const typeOf = ({ base, name }: { base: string; name: string }) =>
      tool({ mcp, name: "entityType_create", args: { base, name } });
    const ticketType = await typeOf({ base: "TICKET", name: "Parity small meeting" });
    const lineType = await typeOf({ base: "LINE", name: "Parity template line" });
    return tool({
      mcp,
      name: "ticketTemplate_create",
      args: {
        name: "Parity template",
        entityTypeId: ticketType.id,
        statusId: made.ticketStatus.id,
        lines: [
          {
            entityTypeId: lineType.id,
            name: "Coffee",
            itemId: made.item.id,
            offsetMinutes: 30,
            durationMinutes: 15,
          },
        ],
      },
    });
  },
});

/** Tickets and what hangs off them; a function so the parity-entities import cycle resolves. */
export function ticketEntities(): ParityEntity[] {
  const sales = [...inboundEntities(), assignment()];
  return [ticket(), ticketTemplate(), line(), ...allocationEntities(), requirement(), ...sales];
}
