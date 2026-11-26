import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { expect } from "vitest";
import { call } from "./helpers";

export const STARTS = "2037-11-03T17:00:00.000Z";

export async function must({
  client,
  name,
  args,
}: {
  client: Client;
  name: string;
  args: Record<string, unknown>;
}) {
  const result = await call({ client, name, args });
  expect(result.isError, `${name}: ${JSON.stringify(result.data)}`).toBe(false);
  return result.data;
}

/** A room with a sitting, saved round tables and one reservation in the client's organization. */
export async function seedReservation({ client }: { client: Client }) {
  const type = await must({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret dining room", capabilities: ["BOOKABLE", "SETUPS"] },
  });
  const room = await must({
    client,
    name: "item_create",
    args: { entityTypeId: type.id, name: "Secret salon" },
  });
  const kind = await must({
    client,
    name: "floorElementKind_create",
    args: { name: "Secret round", shape: "ROUND", widthCm: 150, depthCm: 150, seats: 4 },
  });
  const layout = await must({
    client,
    name: "layout_create",
    args: { itemId: room.id, name: "Secret tables" },
  });
  const saved = await must({
    client,
    name: "layout_save",
    args: {
      id: layout.id,
      expectedVersion: layout.version,
      elements: [1, 2].map((n) => ({
        kindId: kind.id,
        xCm: 200 * n,
        yCm: 200,
        label: `T${n}`,
      })),
    },
  });
  await must({
    client,
    name: "diningRoom_set",
    args: { itemId: room.id, slug: `secret-${Date.now().toString(36)}` },
  });
  await must({
    client,
    name: "diningService_create",
    args: {
      roomItemId: room.id,
      name: "Secret dinner",
      layoutId: layout.id,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      firstStartMinute: 1020,
      lastStartMinute: 1260,
      turnTimes: [{ upToParty: 4, minutes: 90 }],
    },
  });
  const booked = await must({
    client,
    name: "reservation_create",
    args: { roomItemId: room.id, startsAt: STARTS, partySize: 2, bookerName: "Secret booker" },
  });
  const elementIds = saved.elements.map((e: { id: string }) => e.id) as string[];
  return { roomItemId: room.id as string, reservationId: booked.id as string, elementIds };
}
