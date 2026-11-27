import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Json } from "./helpers";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

const TURN_TIMES = "{ upToParty minutes }";
const SERVICE_ARGS = {
  name: "Parity dinner",
  weekdays: [0, 1, 2],
  firstStartMinute: 1020,
  lastStartMinute: 1260,
  turnTimes: [{ upToParty: 4, minutes: 90 }],
};

/** A room with SETUPS, one layout and two labelled tables, set up for table booking (ADR 0119). */
async function seedRoom({ mcp, made }: { mcp: Client; made: Record<string, Json> }) {
  if (made.diningSeed) return made.diningSeed;
  const type = await tool({
    mcp,
    name: "entityType_create",
    args: { base: "ITEM", name: "Parity dining room", capabilities: ["BOOKABLE", "SETUPS"] },
  });
  const item = await tool({
    mcp,
    name: "item_create",
    args: { entityTypeId: type.id, name: "Parity salon" },
  });
  const layout = await tool({
    mcp,
    name: "layout_create",
    args: { itemId: item.id, name: "Parity tables" },
  });
  const tables = [1, 2].map((n) => ({
    kindId: made.floorElementKind.id,
    xCm: 100 * n,
    yCm: 100,
    label: `T${n}`,
  }));
  const saved = await tool({
    mcp,
    name: "layout_save",
    args: { id: layout.id, expectedVersion: layout.version, elements: tables },
  });
  const seed = {
    itemId: item.id,
    layoutId: layout.id,
    elementIds: saved.elements.map((e: Json) => e.id),
  };
  made.diningSeed = seed;
  return seed;
}

const diningRoom: ParityEntity = {
  name: "diningRoom",
  create: async ({ mcp, made }) => {
    const { itemId } = await seedRoom({ mcp, made });
    return tool({ mcp, name: "diningRoom_set", args: { itemId, slug: "parity-salon" } });
  },
  viaMcp: ({ mcp, created }) =>
    tool({ mcp, name: "diningRoom_get", args: { itemId: created.itemId } }),
  viaRest: ({ context, created }) =>
    createRestClient({ context }).get({ path: `/dining-rooms/${created.itemId}` }),
  viaGraph: async ({ context, created, keys }) => {
    const query = `query($id: String!) { diningRoom(itemId: $id) { ${keys.join(" ")} } }`;
    return (await gqlQuery({ context, query, variables: { id: created.itemId } })).diningRoom;
  },
};

const diningService: ParityEntity = {
  ...byId({
    name: "diningService",
    field: "diningService",
    list: "dining-services",
    createTool: "",
    args: {},
    nested: { turnTimes: TURN_TIMES },
  }),
  create: async ({ mcp, made }) => {
    const { itemId, layoutId } = await seedRoom({ mcp, made });
    return tool({
      mcp,
      name: "diningService_create",
      args: { ...SERVICE_ARGS, roomItemId: itemId, layoutId },
    });
  },
};

const diningServiceException: ParityEntity = {
  name: "diningServiceException",
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "diningServiceException_set",
      args: { serviceId: made.diningService.id, date: "2037-11-02", closed: true, note: "Closed" },
    }),
  viaMcp: async ({ mcp, created }) =>
    (
      await tool({
        mcp,
        name: "diningServiceException_list",
        args: { serviceId: created.serviceId },
      })
    ).items[0],
  viaRest: async ({ context, created }) =>
    (
      await createRestClient({ context }).get({
        path: `/dining-services/${created.serviceId}/exceptions`,
      })
    ).items[0],
  viaGraph: async ({ context, created, keys }) => {
    const query = `query($id: String!) { diningServiceExceptions(serviceId: $id) { items { ${keys.join(" ")} } } }`;
    const data = await gqlQuery({ context, query, variables: { id: created.serviceId } });
    return data.diningServiceExceptions.items[0];
  },
};

const tableCombination: ParityEntity = {
  name: "tableCombination",
  create: async ({ mcp, made }) => {
    const { layoutId, elementIds } = await seedRoom({ mcp, made });
    const saved = await tool({
      mcp,
      name: "tableCombination_save",
      args: { layoutId, combinations: [{ name: "Long table", elementIds }] },
    });
    return saved.items[0];
  },
  viaMcp: async ({ mcp, created }) =>
    (await tool({ mcp, name: "tableCombination_list", args: { layoutId: created.layoutId } }))
      .items[0],
  viaRest: async ({ context, created }) =>
    (
      await createRestClient({ context }).get({
        path: `/layouts/${created.layoutId}/table-combinations`,
      })
    ).items[0],
  viaGraph: async ({ context, created, keys }) => {
    const query = `query($id: String!) { tableCombinations(layoutId: $id) { items { ${keys.join(" ")} } } }`;
    const data = await gqlQuery({ context, query, variables: { id: created.layoutId } });
    return data.tableCombinations.items[0];
  },
};

const BOOKING_PAGE =
  "slug logoKey coverKey accentColor intro { sv en } policy { sv en } contactPhone contactEmail embedOrigins guestListIds published";

/** The booking page has no id of its own: its slug tells it apart. */
const bookingPage: ParityEntity = {
  name: "bookingPage",
  create: ({ mcp }) =>
    tool({
      mcp,
      name: "bookingPage_update",
      args: {
        slug: `parity-${Date.now().toString(36)}`,
        intro: { en: "Welcome", sv: "Välkommen" },
        policy: { en: "No shows", sv: "Uteblivande" },
        embedOrigins: ["https://example.com"],
        published: true,
      },
    }),
  viaMcp: ({ mcp }) => tool({ mcp, name: "bookingPage_get", args: {} }),
  viaRest: ({ context }) => createRestClient({ context }).get({ path: "/booking-page" }),
  viaGraph: async ({ context }) =>
    (await gqlQuery({ context, query: `{ bookingPage { ${BOOKING_PAGE} } }`, variables: {} }))
      .bookingPage,
};

/** Table booking setup (ADR 0119): rooms, sittings and their exceptions, combinations, the page. */
export function diningEntities(): ParityEntity[] {
  return [diningRoom, diningService, diningServiceException, tableCombination, bookingPage];
}
