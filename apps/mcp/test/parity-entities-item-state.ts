import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

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

type Cell = Record<string, unknown> & { id: string };
const cellOf = ({ grid, id }: { grid: { cells: Cell[] }; id: string }) =>
  grid.cells.find((cell) => cell.id === id);

/** A status grid cell (ADR 0044): the status made earlier moves the item type's lines to the state. */
const statusStateRule = (): ParityEntity => ({
  name: "statusStateRule",
  create: async ({ mcp, made }) => {
    const args = {
      statusId: made.ticketStatus.id,
      entityTypeId: made.itemState.entityTypeId,
      stateId: made.itemState.id,
    };
    const grid = await tool({ mcp, name: "statusGrid_setCell", args });
    return grid.cells.find((cell: Cell) => cell.stateId === made.itemState.id);
  },
  viaMcp: async ({ mcp, created }) =>
    cellOf({ grid: await tool({ mcp, name: "statusGrid_get", args: {} }), id: created.id }),
  viaRest: async ({ context, created }) =>
    cellOf({
      grid: await createRestClient({ context }).get({ path: "/status-grid" }),
      id: created.id,
    }),
  viaGraph: async ({ context, created, keys }) => {
    const data = await gqlQuery({
      context,
      query: `query { statusGrid { cells { ${keys.join(" ")} } } }`,
    });
    return cellOf({ grid: data.statusGrid, id: created.id });
  },
});

/** Item states; a function so the import cycle with `parity-entities.ts` resolves first. */
export function itemStateEntities(): ParityEntity[] {
  return [itemState(), statusStateRule()];
}
