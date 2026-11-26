import { type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

const RESERVATION = `id roomItemId serviceId startsAt endsAt partySize state source bookerName
  bookerPhone bookerEmail note customerId contactId orderId tables { elementId label }
  requirements { vocabularyValueId quantity } seatedAt completedAt cancelledAt cancelledBy
  cancelReason createdAt`;

/** Created through the command (which also reports warnings), read back as the plain record. */
const reservation: ParityEntity = {
  name: "reservation",
  create: async ({ mcp, made }) => {
    const { itemId } = made.diningSeed;
    const created = await tool({
      mcp,
      name: "reservation_create",
      args: {
        roomItemId: itemId,
        startsAt: "2037-11-03T17:00:00.000Z",
        partySize: 2,
        bookerName: "Parity booker",
      },
    });
    return tool({ mcp, name: "reservation_get", args: { id: created.id } });
  },
  viaMcp: ({ mcp, created }) => tool({ mcp, name: "reservation_get", args: { id: created.id } }),
  viaRest: ({ context, created }) =>
    createRestClient({ context }).get({ path: `/reservations/${created.id}` }),
  viaGraph: async ({ context, created }) => {
    const query = `query($id: String!) { reservation(id: $id) { ${RESERVATION} } }`;
    return (await gqlQuery({ context, query, variables: { id: created.id } })).reservation;
  },
};

const BLOCK_RANGE = { from: "2037-11-04T00:00:00.000Z", to: "2037-11-05T00:00:00.000Z" };

const tableBlock: ParityEntity = {
  name: "tableBlock",
  create: async ({ mcp, made }) => {
    const saved = await tool({
      mcp,
      name: "tableBlock_create",
      args: {
        elementIds: [made.diningSeed.elementIds[1]],
        startsAt: "2037-11-04T17:00:00.000Z",
        endsAt: "2037-11-04T22:00:00.000Z",
        note: "Parity block",
      },
    });
    return saved.items[0];
  },
  viaMcp: async ({ mcp }) =>
    (await tool({ mcp, name: "tableBlock_list", args: BLOCK_RANGE })).items[0],
  viaRest: async ({ context }) =>
    (
      await createRestClient({ context }).get({
        path: `/table-blocks?from=${BLOCK_RANGE.from}&to=${BLOCK_RANGE.to}`,
      })
    ).items[0],
  viaGraph: async ({ context, keys }) => {
    const query = `query($from: DateTime!, $to: DateTime!) { tableBlocks(from: $from, to: $to) { items { ${keys.join(" ")} } } }`;
    return (await gqlQuery({ context, query, variables: BLOCK_RANGE })).tableBlocks.items[0];
  },
};

/** Table reservations and the blocks that hold tables back (ADR 0119). */
export function reservationEntities(): ParityEntity[] {
  return [reservation, tableBlock];
}
