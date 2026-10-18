import { byId, type ParityEntity, tool } from "./parity-entities";

/** A state (ADR 0044) of the item type made earlier; created after the type's default state. */
const itemState = (): ParityEntity => ({
  ...byId({
    name: "itemState",
    field: "itemState",
    list: "item-states",
    createTool: "",
    args: {},
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "itemState_create",
      args: {
        entityTypeId: made.item.entityTypeId,
        name: "Parity state",
        color: "#22c55e",
        inSheets: true,
      },
    }),
});

/** Item states; a function so the import cycle with `parity-entities.ts` resolves first. */
export function itemStateEntities(): ParityEntity[] {
  return [itemState()];
}
