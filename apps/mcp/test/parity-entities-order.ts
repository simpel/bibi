import type { Json } from "./helpers";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { allocationEntities } from "./parity-entities-allocation";
import { assignment } from "./parity-entities-assignment";
import { inboundEntities } from "./parity-entities-inbound";
import { requirement } from "./parity-entities-requirement";

/**
 * An order (ADR 0043) for the customer created earlier. It starts in the entry status, so it comes
 * after the order status entity.
 */
const order = (): ParityEntity => ({
  ...byId({ name: "order", field: "order", list: "orders", createTool: "", args: {} }),
  create: async ({ mcp, made }) => {
    const type = await tool({
      mcp,
      name: "entityType_create",
      args: { base: "ORDER", name: "Parity conference" },
    });
    return tool({
      mcp,
      name: "order_create",
      args: {
        entityTypeId: type.id,
        customerId: made.customer.id,
        contactId: made.contact.id,
        desiredStartsAt: "2037-11-03T08:00:00.000Z",
        desiredEndsAt: "2037-11-03T16:00:00.000Z",
        estimatedHeadcount: 12,
      },
    });
  },
});

/** A line (ADR 0022) on the order, held in the bookable item with its setup. */
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
        orderId: made.order.id,
        entityTypeId: type.id,
        name: "Morning session",
        startsAt: "2037-11-03T09:00:00.000Z",
        endsAt: "2037-11-03T11:00:00.000Z",
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

/** A predefined order (ADR 0043): its own types, the status made earlier and the item as a line. */
const orderTemplate = (): ParityEntity => ({
  ...byId({
    name: "orderTemplate",
    field: "orderTemplate",
    list: "order-templates",
    createTool: "",
    args: {},
  }),
  create: async ({ mcp, made }) => {
    const typeOf = ({ base, name }: { base: string; name: string }) =>
      tool({ mcp, name: "entityType_create", args: { base, name } });
    const orderType = await typeOf({ base: "ORDER", name: "Parity small meeting" });
    const lineType = await typeOf({ base: "LINE", name: "Parity template line" });
    return tool({
      mcp,
      name: "orderTemplate_create",
      args: {
        name: "Parity template",
        entityTypeId: orderType.id,
        statusId: made.orderStatus.id,
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

/** Orders and what hangs off them; a function so the parity-entities import cycle resolves. */
export function orderEntities(): ParityEntity[] {
  const sales = [...inboundEntities(), assignment()];
  return [order(), orderTemplate(), line(), ...allocationEntities(), requirement(), ...sales];
}
