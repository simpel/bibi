import { byId, type ParityEntity, tool } from "./parity-entities";

/** ADR 0059: the bookable item needs one unit of a Person pool for its bookings. */
const itemDemand = (): ParityEntity => ({
  ...byId({
    name: "itemDemand",
    field: "itemDemand",
    list: "item-demands",
    createTool: "",
    args: {},
  }),
  create: async ({ mcp, made }) => {
    const type = await tool({
      mcp,
      name: "entityType_create",
      args: {
        base: "ITEM",
        name: "Parity host",
        capabilities: ["BOOKABLE"],
        resourceKind: "PERSON",
      },
    });
    await tool({ mcp, name: "item_create", args: { entityTypeId: type.id, name: "Host 1" } });
    return tool({
      mcp,
      name: "itemDemand_create",
      args: { itemId: made.item.id, entityTypeId: type.id, windows: ["BOOKING"] },
    });
  },
});

/** The demand's slot on the line booking the item, filled with the prepicked host. */
const lineAllocation = (): ParityEntity => ({
  ...byId({
    name: "lineAllocation",
    field: "lineAllocation",
    list: "line-allocations",
    createTool: "",
    args: {},
  }),
  create: async ({ mcp, made }) =>
    (await tool({ mcp, name: "lineAllocation_list", args: { lineId: made.line.id } })).items[0],
});

/** Demands and allocations; after the line so the demand fills a slot on it. */
export function allocationEntities(): ParityEntity[] {
  return [itemDemand(), lineAllocation()];
}
